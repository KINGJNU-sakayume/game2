import type { ChapterDefinition, Condition, Effect, StoryNode, VisualAspectRatio, VisualAssetKind } from "@/game/types";

export function assembleNodeSources(...sources: ReadonlyArray<Record<string, StoryNode>>): Record<string, StoryNode> {
  const nodes: Record<string, StoryNode> = {};
  for (const source of sources) for (const [key, node] of Object.entries(source)) {
    if (nodes[key]) throw new Error(`Duplicate node ID during chapter assembly: ${key}`);
    if (key !== node.id) throw new Error(`Node key/id mismatch: ${key}/${node.id}`);
    nodes[key] = node;
  }
  return nodes;
}

const kinds = new Set<VisualAssetKind>(["cinematic", "scene", "evidence"]);
const ratios = new Set<VisualAspectRatio>(["9:16", "16:9", "4:3", "1:1"]);
export function validateVisualAssets(chapter: ChapterDefinition, requiredGameIds: readonly string[] = [], referenceIds: readonly string[] = []): string[] {
  const errors: string[] = []; const assets = chapter.visualAssets ?? {};
  for (const [key, asset] of Object.entries(assets)) {
    if (key !== asset.id) errors.push(`Asset key/id mismatch: ${key}/${asset.id}`);
    if (!kinds.has(asset.kind)) errors.push(`Invalid asset kind: ${asset.id}`);
    if (!ratios.has(asset.aspectRatio)) errors.push(`Invalid aspect ratio: ${asset.id}`);
    if (!/^assets\/[\w/-]+\.webp$/.test(asset.src)) errors.push(`Invalid asset src: ${asset.id}`);
    if (asset.fallback?.assetId) {
      const fallback = assets[asset.fallback.assetId];
      if (!fallback) errors.push(`Missing fallback ${asset.fallback.assetId} for ${asset.id}`);
      else if (fallback.status === "missing") errors.push(`Fallback ${fallback.id} for ${asset.id} is itself missing`);
    }
  }
  for (const id of requiredGameIds) if (!assets[id] || assets[id].referenceOnly) errors.push(`Missing canonical game asset: ${id}`);
  for (const id of referenceIds) if (!assets[id]?.referenceOnly) errors.push(`${id} must be reference-only`);
  for (const node of Object.values(chapter.nodes)) {
    const id = node.presentation?.assetId; if (!id) continue;
    if (!assets[id]) errors.push(`Missing asset ${id} from ${node.id}`);
    else if (assets[id].referenceOnly) errors.push(`Reference-only asset used by ${node.id}: ${id}`);
  }
  return errors;
}

function destinations(node: StoryNode): string[] {
  const targets: string[] = [];
  if (node.autoNext) targets.push(node.autoNext);
  for (const choice of node.choices ?? []) {
    if (("terminal" in choice && choice.terminal) || ("action" in choice && choice.action)) continue;
    if (!("next" in choice) || choice.next === undefined) continue;
    if (typeof choice.next === "string") targets.push(choice.next);
    else targets.push(choice.next.success, choice.next.failure);
  }
  return targets;
}

export function reachableNodeIds(chapter: ChapterDefinition): Set<string> {
  const reachable = new Set<string>();
  const stack = [chapter.startNodeId];
  while (stack.length) {
    const id = stack.pop()!;
    if (reachable.has(id) || !chapter.nodes[id]) continue;
    reachable.add(id);
    stack.push(...destinations(chapter.nodes[id]));
  }
  return reachable;
}

export function validateChapterGraph(chapter: ChapterDefinition, checkpoints: readonly string[] = []): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(chapter.nodes));
  if (!ids.has(chapter.startNodeId)) errors.push(`Missing start node: ${chapter.startNodeId}`);
  const automatic = new Map<string, string[]>();
  for (const node of Object.values(chapter.nodes)) {
    if (node.autoNext) automatic.set(node.id, [node.autoNext]);
    for (const choice of node.choices ?? []) {
      if (("terminal" in choice && choice.terminal) || ("action" in choice && choice.action)) continue;
      if (!("next" in choice) || choice.next === undefined) errors.push(`Choice ${node.id}/${choice.id} has no destination`);
    }
    for (const target of destinations(node)) if (!ids.has(target)) errors.push(`Missing target ${target} from ${node.id}`);
  }
  const reachable = reachableNodeIds(chapter);
  for (const checkpoint of checkpoints) if (!reachable.has(checkpoint)) errors.push(`Unreachable checkpoint: ${checkpoint}`);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const detect = (id: string) => {
    if (visiting.has(id)) { errors.push(`Automatic transition cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id); for (const target of automatic.get(id) ?? []) detect(target); visiting.delete(id); visited.add(id);
  };
  for (const id of ids) detect(id);
  return errors;
}

function walkConditions(conditions: readonly Condition[] | undefined, visit: (condition: Condition) => void) {
  for (const condition of conditions ?? []) {
    visit(condition);
    if (condition.type === "all" || condition.type === "any") walkConditions(condition.conditions, visit);
    if (condition.type === "not") walkConditions([condition.condition], visit);
  }
}

function walkEffects(effects: readonly Effect[] | undefined, visit: (effect: Effect) => void, visitCondition: (condition: Condition) => void) {
  for (const effect of effects ?? []) {
    visit(effect);
    if (effect.type === "conditional") {
      walkConditions(effect.conditions, visitCondition);
      walkEffects(effect.effects, visit, visitCondition);
    }
  }
}

/**
 * Content lint: catches the authoring mistakes the type system cannot, so a new
 * chapter fails CI instead of failing silently in play.
 */
export function lintChapter(chapter: ChapterDefinition): string[] {
  const errors: string[] = [];
  const clues = chapter.clueDefinitions ?? {};
  const diagnoses = chapter.diagnosisDefinitions ?? {};
  const tests = chapter.testDefinitions ?? {};
  const patients = chapter.initial?.patients ?? {};
  const characters = chapter.characters;
  const where = (node: StoryNode, detail: string) => `${chapter.id}/${node.id}: ${detail}`;

  const checkCondition = (node: StoryNode) => (condition: Condition) => {
    if (condition.type === "clue" && !clues[condition.clueId]) errors.push(where(node, `unknown clue condition ${condition.clueId}`));
    if (condition.type === "diagnosis" && !diagnoses[condition.diagnosisId]) errors.push(where(node, `unknown diagnosis condition ${condition.diagnosisId}`));
    if (condition.type === "test" && !tests[condition.testId]) errors.push(where(node, `unknown test condition ${condition.testId}`));
    if (condition.type === "trust" && !patients[condition.patientId]) errors.push(where(node, `unknown patient ${condition.patientId}`));
  };
  const checkEffect = (node: StoryNode) => (effect: Effect) => {
    if (effect.type === "clue" && !clues[effect.clueId]) errors.push(where(node, `unknown clue ${effect.clueId}`));
    if ((effect.type === "diagnosis" || effect.type === "primaryDiagnosis") && !diagnoses[effect.diagnosisId]) errors.push(where(node, `unknown diagnosis ${effect.diagnosisId}`));
    if (effect.type === "test" && !tests[effect.testId]) errors.push(where(node, `unknown test ${effect.testId}`));
    if ("patientId" in effect && !patients[effect.patientId]) errors.push(where(node, `unknown patient ${effect.patientId}`));
  };

  const reachable = reachableNodeIds(chapter);
  for (const node of Object.values(chapter.nodes)) {
    if (!reachable.has(node.id)) errors.push(where(node, "unreachable from the start node"));
    const onCondition = checkCondition(node); const onEffect = checkEffect(node);
    walkConditions(node.conditions, onCondition);
    walkEffects(node.onEnter, onEffect, onCondition);
    walkEffects(node.onExit, onEffect, onCondition);
    for (const block of node.blocks) {
      walkConditions(block.conditions, onCondition);
      if (block.type === "dialogue" && characters && !characters[block.speaker]) errors.push(where(node, `speaker "${block.speaker}" is not in the character list`));
    }
    const choiceIds = new Set<string>();
    for (const choice of node.choices ?? []) {
      if (choiceIds.has(choice.id)) errors.push(where(node, `duplicate choice id ${choice.id}`));
      choiceIds.add(choice.id);
      walkConditions(choice.conditions, onCondition);
      walkEffects(choice.effects, onEffect, onCondition);
    }
    for (const hotspot of node.presentation?.hotspots ?? []) if (!choiceIds.has(hotspot.choiceId)) errors.push(where(node, `hotspot ${hotspot.id} has no matching choice`));
    if (!node.autoNext && !(node.choices ?? []).length) errors.push(where(node, "dead end: no choices and no autoNext"));
    const assetId = node.presentation?.assetId;
    if (assetId && !chapter.visualAssets?.[assetId]) errors.push(where(node, `unknown asset ${assetId}`));
  }
  if (chapter.outcomes) {
    for (const ending of ["END_A", "END_B", "END_C", "END_D", "END_E"]) if (!chapter.nodes[ending]) errors.push(`${chapter.id}: missing ending node ${ending}`);
    if (!patients[chapter.outcomes.patientId]) errors.push(`${chapter.id}: outcome patient ${chapter.outcomes.patientId} is not defined`);
  }
  const completionNode = chapter.completion?.nodeId ?? "CASE_COMPLETE";
  if (chapter.completion && !chapter.nodes[completionNode]) errors.push(`${chapter.id}: missing completion node ${completionNode}`);
  if (chapter.completion && !chapter.outcomes) errors.push(`${chapter.id}: a completable chapter needs outcome rules`);
  return errors;
}

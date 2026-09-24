import type { ChapterDefinition, StoryNode, VisualAspectRatio, VisualAssetKind } from "@/game/types";

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
export function validateVisualAssets(chapter: ChapterDefinition, requiredGameIds: readonly string[] = []): string[] {
  const errors: string[] = []; const assets = chapter.visualAssets ?? {};
  for (const [key, asset] of Object.entries(assets)) {
    if (key !== asset.id) errors.push(`Asset key/id mismatch: ${key}/${asset.id}`);
    if (!kinds.has(asset.kind)) errors.push(`Invalid asset kind: ${asset.id}`);
    if (!ratios.has(asset.aspectRatio)) errors.push(`Invalid aspect ratio: ${asset.id}`);
    if (!/^assets\/[\w/-]+\.webp$/.test(asset.src)) errors.push(`Invalid asset src: ${asset.id}`);
  }
  for (const id of requiredGameIds) if (!assets[id] || assets[id].referenceOnly) errors.push(`Missing canonical game asset: ${id}`);
  if (!assets.CHR_HARIN_MASTER_01?.referenceOnly) errors.push("CHR_HARIN_MASTER_01 must be reference-only");
  for (const node of Object.values(chapter.nodes)) {
    const id = node.presentation?.assetId; if (!id) continue;
    if (!assets[id]) errors.push(`Missing asset ${id} from ${node.id}`);
    else if (assets[id].referenceOnly) errors.push(`Reference-only asset used by ${node.id}: ${id}`);
  }
  return errors;
}

export function validateChapterGraph(chapter: ChapterDefinition, checkpoints: readonly string[] = []): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(chapter.nodes));
  if (!ids.has(chapter.startNodeId)) errors.push(`Missing start node: ${chapter.startNodeId}`);
  const edges = new Map<string, string[]>();
  const automatic = new Map<string, string[]>();
  for (const node of Object.values(chapter.nodes)) {
    const targets: string[] = [];
    if (node.autoNext) { targets.push(node.autoNext); automatic.set(node.id, [node.autoNext]); }
    for (const choice of node.choices ?? []) {
      if ("terminal" in choice && choice.terminal) continue;
      if (!("next" in choice) || choice.next === undefined) { errors.push(`Choice ${node.id}/${choice.id} has no destination`); continue; }
      if (typeof choice.next === "string") targets.push(choice.next);
      else targets.push(choice.next.success, choice.next.failure);
    }
    edges.set(node.id, targets);
    for (const target of targets) if (!ids.has(target)) errors.push(`Missing target ${target} from ${node.id}`);
  }
  const reachable = new Set<string>();
  const visit = (id: string) => { if (reachable.has(id) || !ids.has(id)) return; reachable.add(id); for (const target of edges.get(id) ?? []) visit(target); };
  visit(chapter.startNodeId);
  for (const checkpoint of checkpoints) if (!reachable.has(checkpoint)) errors.push(`Unreachable checkpoint: ${checkpoint}`);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const detect = (id: string) => { if (visiting.has(id)) { errors.push(`Automatic transition cycle at ${id}`); return; } if (visited.has(id)) return; visiting.add(id); for (const target of automatic.get(id) ?? []) detect(target); visiting.delete(id); visited.add(id); };
  for (const id of ids) detect(id);
  return errors;
}

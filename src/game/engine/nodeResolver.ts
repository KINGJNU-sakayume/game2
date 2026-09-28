import type { ChapterDefinition, Choice, GameState, StoryNode } from "@/game/types";
import { resolveCheck } from "./checkResolver";
import { evaluateConditions } from "./conditionResolver";
import { applyEffects } from "./effectResolver";

export function getAvailableChoices(node: StoryNode, state: GameState): Choice[] {
  return (node.choices ?? []).filter((choice) => evaluateConditions(choice.conditions, state));
}

/** Choices that leave the story graph (restart, back to title…) are handled by the app shell. */
export const isShellAction = (choice: Choice): boolean => "action" in choice && Boolean(choice.action);

export function enterNode(state: GameState, chapter: ChapterDefinition, nodeId: string, timestamp: number): GameState {
  let targetId = nodeId;
  let nextState = state;
  const seen = new Set<string>();
  while (true) {
    const node = chapter.nodes[targetId];
    if (!node) throw new Error(`Unknown story node: ${targetId}`);
    if (!evaluateConditions(node.conditions, nextState)) throw new Error(`Conditions not met for node: ${targetId}`);
    if (seen.has(targetId)) throw new Error(`autoNext cycle detected at node: ${targetId}`);
    seen.add(targetId);
    nextState = applyEffects(nextState, node.onEnter);
    nextState = { ...nextState, currentNodeId: targetId, nodeEnteredAt: timestamp, updatedAt: timestamp, visitedNodeIds: [...nextState.visitedNodeIds, targetId] };
    // Timed transitions are driven by the renderer so the scene remains visible
    // for its content-defined duration. Ordinary autoNext nodes retain the
    // existing synchronous resolver behavior.
    if (!node.autoNext || node.presentation?.autoAdvanceMs !== undefined) return nextState;
    nextState = applyEffects(nextState, node.onExit);
    targetId = node.autoNext;
  }
}

/**
 * Completes a timed autoNext transition (e.g. a title card). The current node's
 * exit effects run exactly as they would for an ordinary transition.
 */
export function advanceTimedNode(state: GameState, chapter: ChapterDefinition, timestamp: number): GameState {
  const node = chapter.nodes[state.currentNodeId];
  if (!node?.autoNext) return state;
  return enterNode(applyEffects(state, node.onExit), chapter, node.autoNext, timestamp);
}

export function executeChoice(state: GameState, chapter: ChapterDefinition, choiceId: string, timestamp: number): GameState {
  const node = chapter.nodes[state.currentNodeId];
  if (!node) throw new Error(`Unknown current node: ${state.currentNodeId}`);
  const choice = getAvailableChoices(node, state).find(({ id }) => id === choiceId);
  if (!choice) throw new Error(`Choice is unavailable: ${choiceId}`);
  let next = applyEffects(state, node.onExit);
  next = applyEffects(next, choice.effects);
  if (choice.timeCost) next = { ...next, time: next.time + choice.timeCost };
  if (("terminal" in choice && choice.terminal) || isShellAction(choice)) return { ...next, updatedAt: timestamp };
  let destination: string;
  if (typeof choice.next === "string") destination = choice.next;
  else {
    if (!choice.check || !choice.next) throw new Error(`Choice ${choice.id} has outcome destinations but no check`);
    const check = resolveCheck(choice.check, next, timestamp);
    next = { ...next, rngState: check.rngState, checkResults: { ...next.checkResults, [check.result.checkId]: check.result } };
    // A first-time success is the moment the run leans on an ability.
    if (check.result.success && !check.cached) next = { ...next, resonance: { ...next.resonance, [check.result.ability]: next.resonance[check.result.ability] + 1 } };
    destination = check.result.success ? choice.next.success : choice.next.failure;
  }
  return enterNode(next, chapter, destination, timestamp);
}

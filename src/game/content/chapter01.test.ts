import { describe, expect, it } from "vitest";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { enterNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import type { GameState, PlayerState } from "@/game/types";
import { defaultPlayer, demoChapter } from "./demoChapter";

function chapterState(player: PlayerState = defaultPlayer): GameState {
  const base: GameState = {
    runId: "chapter-test", chapterId: demoChapter.id, currentNodeId: demoChapter.startNodeId,
    player, patients: demoChapter.initial!.patients!, flags: demoChapter.initial!.flags!,
    time: demoChapter.initial!.time!, resonance: 0, rngState: 1234, checkResults: {},
    visitedNodeIds: [], nodeEnteredAt: 0, updatedAt: 0,
  };
  return enterNode(base, demoChapter, demoChapter.startNodeId, 1);
}

const chooseOnly = (state: GameState) => executeChoice(state, demoChapter, getAvailableChoices(demoChapter.nodes[state.currentNodeId], state)[0].id, state.updatedAt + 1);

describe("Chapter 1 vertical slice", () => {
  it("progresses from PR_001 through PR_006 in order", () => {
    let state = chapterState();
    expect(state.currentNodeId).toBe("PR_001");
    for (const expected of ["PR_002", "PR_003", "PR_004", "PR_005", "PR_006"]) {
      state = chooseOnly(state);
      expect(state.currentNodeId).toBe(expected);
    }
    expect(state.flags.clue_previous_episode_hint).toBe(true);
    state = enterNode(state, demoChapter, "ER_001", 10);
    expect(state.currentNodeId).toBe("ER_001");
  });

  it("shows the PR_002 passive observation block only at threshold 3", () => {
    const passive = demoChapter.nodes.PR_002.blocks.find((block) => block.type === "thought")!;
    const below = chapterState({ ...defaultPlayer, abilities: { ...defaultPlayer.abilities, observation: 2 } });
    const threshold = chapterState({ ...defaultPlayer, abilities: { ...defaultPlayer.abilities, observation: 3 } });
    expect(evaluateConditions(passive.conditions, below)).toBe(false);
    expect(evaluateConditions(passive.conditions, threshold)).toBe(true);
    expect(passive.text).toBe("한 동작이 반 박자 늦었다.");
  });

  it.each([
    ["from-start", 44, "ER_002"],
    ["essentials", 40, "ER_002"],
    ["hurts", 39, "ER_002"],
  ])("applies ER_001 choice %s trust correctly", (choiceId, trust, destination) => {
    const state = enterNode(chapterState(), demoChapter, "ER_001", 2);
    const result = executeChoice(state, demoChapter, choiceId, 3);
    expect(result.patients.harin.trust).toBe(trust);
    expect(result.currentNodeId).toBe(destination);
  });

  it("returns explicitly to the ER_002 hub and hides a completed category", () => {
    let state = enterNode(chapterState(), demoChapter, "ER_002", 2);
    state = executeChoice(state, demoChapter, "pain", 3);
    expect(state.currentNodeId).toBe("ER_PAIN_01");
    state = executeChoice(state, demoChapter, "return-pain", 4);
    expect(state.currentNodeId).toBe("ER_002");
    expect(getAvailableChoices(demoChapter.nodes.ER_002, state).map(({ id }) => id)).not.toContain("pain");
    expect(state.visitedNodeIds.filter((id) => id === "ER_002")).toHaveLength(2);
  });
});

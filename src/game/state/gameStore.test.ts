import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChapterDefinition, GameState } from "@/game/types";

const persistence = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
}));

vi.mock("./saveStore", () => ({
  loadActiveRun: persistence.load,
  saveActiveRun: persistence.save,
}));

import { useGameStore } from "./gameStore";

const chapter: ChapterDefinition = {
  id: "test",
  title: "Test",
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      blocks: [],
      choices: [{
        id: "check",
        label: "Check",
        check: { id: "persistent-check", ability: "reasoning", dc: 7 },
        next: { success: "middle", failure: "middle" },
      }],
    },
    middle: {
      id: "middle",
      blocks: [],
      choices: [{ id: "return", label: "Return", next: "start" }],
    },
  },
};

function initialState(): GameState {
  return {
    runId: "run",
    chapterId: chapter.id,
    currentNodeId: chapter.startNodeId,
    player: { name: "Player", abilities: { observation: 0, empathy: 0, reasoning: 2, resolve: 0 } },
    patients: {},
    flags: {},
    time: 0,
    resonance: 0,
    rngState: 42,
    checkResults: {},
    visitedNodeIds: [chapter.startNodeId],
    nodeEnteredAt: 0,
    updatedAt: 0,
  };
}

describe("gameStore persistence failures", () => {
  beforeEach(() => {
    persistence.save.mockReset();
    useGameStore.setState({
      activeRun: initialState(),
      hydrated: true,
      inputLocked: false,
      persistenceStatus: "healthy",
    });
  });

  it("keeps the completed transition in memory, unlocks input, and retries later", async () => {
    persistence.save.mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    await useGameStore.getState().choose(chapter, "check");

    const afterFailure = useGameStore.getState();
    expect(afterFailure.activeRun?.currentNodeId).toBe("middle");
    expect(afterFailure.activeRun?.checkResults["persistent-check"]).toBeDefined();
    expect(afterFailure.persistenceStatus).toBe("degraded");
    expect(afterFailure.inputLocked).toBe(false);

    persistence.save.mockResolvedValueOnce(undefined);
    await afterFailure.choose(chapter, "return");

    const afterRecovery = useGameStore.getState();
    expect(afterRecovery.activeRun?.currentNodeId).toBe("start");
    expect(afterRecovery.persistenceStatus).toBe("healthy");
    expect(afterRecovery.inputLocked).toBe(false);
    expect(persistence.save).toHaveBeenCalledTimes(2);
  });

  it("does not reroll a cached check after a failed save", async () => {
    persistence.save.mockRejectedValueOnce(new Error("quota exceeded"));
    await useGameStore.getState().choose(chapter, "check");
    const failedSaveState = useGameStore.getState().activeRun!;
    const originalResult = failedSaveState.checkResults["persistent-check"];
    const rngAfterCheck = failedSaveState.rngState;

    persistence.save.mockResolvedValue(undefined);
    await useGameStore.getState().choose(chapter, "return");
    await useGameStore.getState().choose(chapter, "check");

    const retriedState = useGameStore.getState().activeRun!;
    expect(retriedState.checkResults["persistent-check"]).toEqual(originalResult);
    expect(retriedState.rngState).toBe(rngAfterCheck);
    expect(useGameStore.getState().persistenceStatus).toBe("healthy");
  });
});

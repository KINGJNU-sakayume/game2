import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChapterDefinition, GameState } from "@/game/types";
import { zeroResonance } from "@/game/abilities";

const persistence = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  profileSave: vi.fn(),
}));

vi.mock("./saveStore", () => ({
  loadActiveRun: persistence.load,
  loadProfile: vi.fn().mockResolvedValue({ completedCases: [], caseMemories: [], archives: [], firstEndingCompleted: false }),
  saveActiveRun: persistence.save,
  saveProfile: persistence.profileSave,
  clearActiveRun: vi.fn(),
  completeCase: vi.fn((profile, caseId, memory, archive) => ({
    completedCases: [...new Set([...profile.completedCases, caseId])],
    caseMemories: profile.caseMemories.some((item: { id: string }) => item.id === memory.id) ? profile.caseMemories : [...profile.caseMemories, memory],
    archives: [...profile.archives.filter((item: { caseId: string }) => item.caseId !== archive.caseId), archive],
    firstEndingCompleted: true,
  })),
  emptyProfile: () => ({ completedCases: [], caseMemories: [], archives: [], firstEndingCompleted: false }),
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
    player: { name: "Player", abilities: { observation: 0, history: 0, empathy: 0, mechanism: 0, reasoning: 2, suspicion: 0, decision: 0 } },
    patients: {},
    flags: {},
    values: {},
    time: 0,
    resonance: zeroResonance(),
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
    persistence.profileSave.mockReset();
    useGameStore.setState({
      activeRun: initialState(),
      profile: { completedCases: [], caseMemories: [], archives: [], firstEndingCompleted: false },
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

  it("records permanent case completion even when the active-run save fails", async () => {
    const completionChapter: ChapterDefinition = {
      id: "complete-test",
      title: "Complete",
      startNodeId: "start",
      nodes: {
        start: { id: "start", blocks: [], choices: [{ id: "finish", label: "Finish", next: "CASE_COMPLETE" }] },
        CASE_COMPLETE: { id: "CASE_COMPLETE", blocks: [] },
      },
      completion: {
        caseId: "complete-test",
        memory: { id: "memory", title: "Memory", description: "Description", sourceChapter: "complete-test" },
        archive: {
          caseId: "CASE TEST",
          title: "Test archive",
          finalDiagnosis: "Diagnosis",
          biochemicalDiagnosis: "Biochemical",
          subtypeConfirmation: "Subtype",
          complications: [],
        },
      },
    };
    const run = { ...initialState(), chapterId: completionChapter.id };
    useGameStore.setState({ activeRun: run });
    persistence.save.mockRejectedValueOnce(new Error("active run unavailable"));
    persistence.profileSave.mockResolvedValueOnce(undefined);

    await useGameStore.getState().choose(completionChapter, "finish");

    const result = useGameStore.getState();
    expect(result.activeRun?.currentNodeId).toBe("CASE_COMPLETE");
    expect(result.profile.firstEndingCompleted).toBe(true);
    expect(result.profile.completedCases).toContain("complete-test");
    expect(persistence.profileSave).toHaveBeenCalledTimes(1);
    expect(result.persistenceStatus).toBe("degraded");
    expect(result.inputLocked).toBe(false);
  });

  it("restores the same current node from a saved run", async () => {
    const saved = { ...initialState(), currentNodeId: "middle", visitedNodeIds: ["start", "middle"] };
    useGameStore.getState().restore(saved);
    expect(useGameStore.getState().activeRun?.currentNodeId).toBe("middle");
  });
});

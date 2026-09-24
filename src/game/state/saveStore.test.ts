import { beforeEach, describe, expect, it } from "vitest";
import type { GameState } from "@/game/types";
import { clearActiveRun, loadActiveRun, saveActiveRun } from "./saveStore";

const savedState: GameState = {
  runId: "saved-run", chapterId: "chapter-01", currentNodeId: "ER_002",
  player: { name: "당직의", abilities: { observation: 3, empathy: 1, reasoning: 1, resolve: 1 } },
  patients: { harin: { id: "harin", name: "윤하린", trust: 44, diseaseStage: "latent", clues: [], diagnoses: [], tests: {} } },
  flags: {}, time: 0, resonance: 0, rngState: 9876, checkResults: {},
  visitedNodeIds: ["PR_001", "ER_002"], nodeEnteredAt: 1, updatedAt: 2,
};

describe("active run persistence", () => {
  beforeEach(async () => clearActiveRun());

  it("restores the same current node and preserved gameplay state", async () => {
    await saveActiveRun(savedState);
    const restored = await loadActiveRun();
    expect(restored?.currentNodeId).toBe("ER_002");
    expect(restored?.patients.harin.trust).toBe(44);
    expect(restored?.rngState).toBe(9876);
  });
});

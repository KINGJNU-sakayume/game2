import { beforeEach, describe, expect, it } from "vitest";
import type { GameState } from "@/game/types";
import { clearActiveRun, loadActiveRun, saveActiveRun } from "./saveStore";
import { zeroResonance } from "@/game/abilities";

const savedState: GameState = {
  runId: "saved-run", chapterId: "chapter-01", currentNodeId: "ER_002",
  player: { name: "당직의", abilities: { observation: 3, history: 2, empathy: 2, mechanism: 2, reasoning: 2, suspicion: 2, decision: 2 } },
  patients: { harin: { id: "harin", name: "윤하린", trust: 44, diseaseStage: "latent", clues: ["constipation"], diagnoses: [], tests: {} } },
  flags: {}, values: {}, time: 0, resonance: { ...zeroResonance(), empathy: 2 }, rngState: 9876, checkResults: { history: { checkId: "history", rolls: [3, 4], ability: "history", abilityModifier: 2, modifiers: 0, total: 9, dc: 8, success: true, timestamp: 1 } },
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
    expect(restored?.player.abilities).toEqual(savedState.player.abilities);
    expect(restored?.resonance).toEqual(savedState.resonance);
    expect(restored?.patients.harin.clues).toEqual(["constipation"]);
    expect(restored?.checkResults).toEqual(savedState.checkResults);
  });
});

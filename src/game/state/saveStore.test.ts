import { beforeEach, describe, expect, it } from "vitest";
import type { CaseArchive, GameState } from "@/game/types";
import { clearActiveRun, completeCase, emptyProfile, loadActiveRun, saveActiveRun } from "./saveStore";
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

  it("round-trips Chapter 1 field and diagnostic progress", async () => {
    const fieldState: GameState = {
      ...savedState,
      currentNodeId: "TEST_PORPH_01",
      flags: { visited_apartment: true, field_overstay: true, pbg_ordered: true },
      values: { field_locations_visited: 3, primary_diagnosis: "acute_hepatic_porphyria" },
      patients: { harin: { ...savedState.patients.harin, trust: 29, clues: ["rapid_weight_loss", "autonomic_instability"], tests: { urine_pbg_ala: "pending" } } },
    };
    await saveActiveRun(fieldState);
    const restored = await loadActiveRun();
    expect(restored).toMatchObject({
      currentNodeId: "TEST_PORPH_01", rngState: 9876,
      flags: { visited_apartment: true, field_overstay: true, pbg_ordered: true },
      values: { field_locations_visited: 3, primary_diagnosis: "acute_hepatic_porphyria" },
      patients: { harin: { trust: 29, clues: ["rapid_weight_loss", "autonomic_instability"], tests: { urine_pbg_ala: "pending" } } },
    });
    expect(restored?.checkResults).toEqual(savedState.checkResults);
  });
});

describe("permanent profile", () => {
  const memory = { id: "normal_is_not_diagnosis", title: "정상은 진단이 아니다", description: "memory", sourceChapter: "chapter-01" };
  const archive: CaseArchive = { caseId: "CASE 01", title: "case", finalDiagnosis: "AIP", biochemicalDiagnosis: "AHP", subtypeConfirmation: "HMBS", diagnosis: "appropriate", treatment: "appropriate", trigger: "sufficient", relationship: "trusted", triggersDiscovered: [], complications: [], outcome: "recovered", followUp: "clinic", endingId: "END_A" };
  it("deduplicates memories and archives while setting first completion", () => { const once=completeCase(emptyProfile(),"chapter-01",memory,archive); const twice=completeCase(once,"chapter-01",memory,archive); expect(twice.caseMemories).toHaveLength(1); expect(twice.archives).toHaveLength(1); expect(twice.completedCases).toEqual(["chapter-01"]); expect(twice.firstEndingCompleted).toBe(true); });
});

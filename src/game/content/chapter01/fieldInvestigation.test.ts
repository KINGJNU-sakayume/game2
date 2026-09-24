import { describe, expect, it } from "vitest";
import { zeroResonance } from "@/game/abilities";
import { enterNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import type { GameState, PlayerState } from "@/game/types";
import { chapter01, defaultPlayer } from ".";
import { validateChapterGraph } from "./graphValidator";

const player = (abilities: Partial<PlayerState["abilities"]> = {}): PlayerState => ({ ...defaultPlayer, abilities: { ...defaultPlayer.abilities, ...abilities } });
function state(abilities: Partial<PlayerState["abilities"]> = {}, trust = 40): GameState {
  const patients = structuredClone(chapter01.initial!.patients!);
  patients.harin.trust = trust;
  return {
    runId: "field-test", chapterId: chapter01.id, currentNodeId: "FIELD_GATE", player: player(abilities),
    patients, flags: structuredClone(chapter01.initial!.flags!), values: {},
    time: 1328, resonance: zeroResonance(), rngState: 1234, checkResults: {}, visitedNodeIds: [], nodeEnteredAt: 0, updatedAt: 0,
  } satisfies GameState;
}
const at = (id: string, current = state()) => enterNode(current, chapter01, id, current.updatedAt + 1);
const choose = (current: GameState, id: string) => executeChoice(current, chapter01, id, current.updatedAt + 1);
const choiceIds = (current: GameState) => getAvailableChoices(chapter01.nodes[current.currentNodeId], current).map(({ id }) => id);

describe("Chapter 1 content graph", () => {
  it("has valid destinations, reachable checkpoints, and no automatic cycle", () => {
    expect(validateChapterGraph(chapter01, ["FIELD_GATE", "DET_001", "CASE_002", "CASE_003", "WAIT_001"])).toEqual([]);
  });
});

describe("field investigation", () => {
  it("keeps low trust playable while restricting apartment access", () => {
    const current = at("FIELD_GATE", state({}, 10));
    expect(choiceIds(current)).not.toContain("apartment");
    expect(choiceIds(current)).toEqual(expect.arrayContaining(["rehearsal", "family", "hospital", "return-hospital"]));
  });

  it("records apartment clues and prevents hotspot time farming", () => {
    let current = at("APT_001", state({ observation: 3, suspicion: 3 }));
    current = choose(current, "fridge");
    expect(current.time).toBe(1334);
    expect(current.flags.restricted_diet_known).toBe(true);
    expect(current.patients.harin.clues).toContain("severe_caloric_restriction");
    current = choose(current, "continue-APT_001");
    expect(choiceIds(current)).not.toContain("fridge");
    current = choose(current, "vanity");
    expect(current.flags.ocp_known).toBe(true);
    expect(current.patients.harin.clues).toContain("recent_hormonal_medication");
    current = choose(current, "continue-APT_001");
    current = choose(current, "desk");
    expect(current.patients.harin.clues).toContain("rapid_weight_loss");
  });

  it("allows a low-ability vanity visit but leaves OCP discoverable elsewhere", () => {
    let current = at("APT_VANITY", state({ observation: 0, suspicion: 0 }));
    expect(current.flags.apt_vanity_complete).toBe(true);
    expect(current.flags.ocp_known).toBe(false);
    current.flags.restricted_diet_known = true;
    current = at("REH_001", current);
    expect(choiceIds(current)).toContain("ocp");
    current = choose(current, "ocp");
    expect(current.flags.ocp_known).toBe(true);
  });

  it("captures rehearsal diet, motor weakness, lead red herring and deduplicates clues", () => {
    let current = at("REH_DIET"); current = at("REH_DIET", current);
    expect(current.patients.harin.clues.filter(id => id === "severe_caloric_restriction")).toHaveLength(1);
    current = at("REH_MOTOR", current);
    current = at("REH_ENV", current);
    expect(current.flags.early_weakness_known).toBe(true);
    expect(current.patients.harin.clues).toContain("preexisting_motor_weakness");
    expect(current.flags.lead_poisoning_available).toBe(true);
    expect(current.patients.harin.diagnoses).toContain("lead_poisoning");
  });

  it("penalizes unauthorized family contact and provides permission routes", () => {
    let current = at("FAM_001", state({}, 50));
    current = choose(current, "contact");
    expect(current.patients.harin.trust).toBe(35);
    expect(current.flags.family_boundary_broken).toBe(true);
    current = at("FAM_PERMISSION", state({ empathy: 20 }, 50));
    current = choose(current, "explain");
    expect(current.currentNodeId).toBe("FAM_PERMISSION_OK");
    expect(current.patients.harin.trust).toBe(53);
    current = choose(current, "continue-FAM_002");
    current = choose(current, "continue-FAM_003");
    expect(current.flags.family_history_known).toBe(true);
    expect(current.patients.harin.clues).toContain("maternal_family_recurrent_neurovisceral_attacks");
  });

  it("does not unlock the lead red herring without enough mechanism insight", () => {
    let current = at("REH_ENV", state({ mechanism: 2, suspicion: 4 }));
    expect(current.flags.lead_poisoning_available).toBe(false);
    expect(current.patients.harin.diagnoses).not.toContain("lead_poisoning");
    current = at("REH_ENV", state({ mechanism: 3 }));
    expect(current.flags.lead_poisoning_available).toBe(true);
    expect(current.patients.harin.diagnoses).toContain("lead_poisoning");
  });

  it("treats contacting family after refused permission as a boundary breach", () => {
    let current = at("FAM_PERMISSION_DELAY", state({}, 50));
    current = choose(current, "contact-anyway");
    expect(current.currentNodeId).toBe("FAM_002");
    expect(current.flags.family_boundary_broken).toBe(true);
    expect(current.patients.harin.trust).toBe(35);
  });

  it("supports two locations then marks a chosen third location as overstay", () => {
    let current = state(); current.values.field_locations_visited = 2;
    current = at("FIELD_GATE", current);
    expect(choiceIds(current)).toContain("rehearsal-overstay");
    current = choose(current, "rehearsal-overstay");
    const before = current.time;
    current = choose(current, "continue-overstay");
    expect(current.flags.field_overstay).toBe(true);
    expect(current.time).toBe(before + 15);
    expect(current.currentNodeId).toBe("REH_001");
  });

  it.each(["APT_EXIT", "REH_EXIT", "FAM_004", "HOSP_EXTRA_001"])("can converge %s to deterioration", (node) => {
    let current = at(node);
    if (node === "HOSP_EXTRA_001") current = choose(current, "finish"); else current = choose(current, `continue-FIELD_RETURN`);
    if (current.currentNodeId === "FIELD_RETURN") current = choose(current, "hospital");
    expect(current.currentNodeId).toBe("DET_001");
    expect(current.time).toBeGreaterThanOrEqual(1411);
  });
});

describe("deterioration and diagnostic turn", () => {
  it("reaches CASE_002 with worsening clues and preserves monotonic time", () => {
    let current = state(); current.time = 1500;
    current = at("DET_001", current);
    expect(current.time).toBe(1500);
    current = choose(current, "continue-DET_002");
    current = choose(current, "continue-DET_003");
    expect(current.patients.harin.clues).toEqual(expect.arrayContaining(["perceptual_disturbance", "worsening_neuropsychiatric_symptoms", "progressive_motor_neuropathy", "autonomic_instability"]));
    current = choose(current, "continue-CASE_002");
    expect(current.currentNodeId).toBe("CASE_002");
  });

  it("exposes conditional CASE_002 thoughts", () => {
    const current = state(); Object.assign(current.flags, { restricted_diet_known: true, ocp_known: true, family_history_known: true, urine_color_known: true });
    const visible = chapter01.nodes.CASE_002.blocks.filter(block => !block.conditions || block.conditions.every(condition => {
      if (condition.type !== "flag") return true; return current.flags[condition.key];
    })).map(block => block.text);
    expect(visible).toEqual(expect.arrayContaining(["금식.", "호르몬.", "이모.", "소변."]));
  });

  it.each([["lead", "DX_LEAD_01"], ["gbs", "DX_GBS_01"], ["pheo", "DX_PHEO_01"], ["toxic", "DX_TOXIC_01"]])("returns the %s differential to CASE_003", (id, expected) => {
    let current = choose(at("CASE_003"), id);
    expect(current.currentNodeId).toBe(expected);
    if (id === "lead") { const before = 1328; expect(current.time).toBe(before + 20); current = choose(current, "continue-DX_LEAD_02"); }
    current = choose(current, getAvailableChoices(chapter01.nodes[current.currentNodeId], current)[0].id);
    expect(current.currentNodeId).toBe("CASE_003");
  });

  it("records psychiatric anchoring without blocking progress", () => {
    let current = choose(at("CASE_003"), "psych");
    current = choose(current, "anchor");
    expect(current.values.primary_diagnosis).toBe("functional_psychiatric");
    expect(current.flags.diagnostic_anchoring).toBe(true);
    current = choose(current, "continue-CASE_003");
    expect(current.currentNodeId).toBe("CASE_003");
  });

  it("lets genetic testing return before PBG/ALA reaches WAIT_001", () => {
    let current = choose(at("CASE_003"), "porphyria");
    current = choose(current, "continue-TEST_PORPH_01");
    current = choose(current, "genetic");
    expect(current.patients.harin.tests.porphyria_genetic).toBe("ordered");
    current = choose(current, "continue-TEST_PORPH_01");
    current = choose(current, "pbg");
    expect(current.flags.pbg_ordered).toBe(true);
    expect(current.patients.harin.tests.urine_pbg_ala).toBe("pending");
    current = choose(current, "continue-WAIT_001");
    expect(current.currentNodeId).toBe("WAIT_001");
  });
});

import { describe, expect, it } from "vitest";
import { zeroResonance } from "@/game/abilities";
import { createChapter01Archive, classifyRelationship, classifyTrigger, endingContext, resolveEnding } from "@/game/engine/endingResolver";
import { enterNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import type { GameState } from "@/game/types";
import { chapter01, defaultPlayer } from ".";
import { validateChapterGraph } from "./graphValidator";

function state(id = "WAIT_001"): GameState {
  const base: GameState = { runId: "r", chapterId: chapter01.id, currentNodeId: id, player: structuredClone(defaultPlayer), patients: structuredClone(chapter01.initial!.patients!), flags: { ...chapter01.initial!.flags }, values: {}, time: 100, resonance: zeroResonance(), rngState: 1, checkResults: {}, visitedNodeIds: [], nodeEnteredAt: 0, updatedAt: 0 };
  return enterNode(base, chapter01, id, 1);
}
const choose = (s: GameState, id: string) => executeChoice(s, chapter01, id, s.updatedAt + 1);

describe("Chapter 1 treatment and resolution", () => {
  it("offers all three WAIT_001 treatment directions", () => expect(getAvailableChoices(chapter01.nodes.WAIT_001, state()).map(c => c.id)).toEqual(["early-hemin", "glucose-wait", "wait-result"]));
  it("starts early hemin while PBG remains pending and halts progression", () => { let s = state(); s.patients.harin.tests.urine_pbg_ala = "pending"; s = choose(s, "early-hemin"); expect(s.flags.hemin_started).toBe(true); expect(s.values.treatment_timing).toBe("appropriate"); expect(s.flags.disease_progression_halted).toBe(true); expect(s.patients.harin.tests.urine_pbg_ala).toBe("pending"); });
  it("makes glucose-only treatment delayed, advances time, and still permits hemin", () => { let s = state(); s = choose(s, "glucose-wait"); expect(s.time).toBe(120); expect(s.values.treatment_timing).toBe("delayed"); s = choose(s, "continue-PBG_RESULT"); s = choose(s, "treatment-decision"); s = choose(s, "glucose"); expect(getAvailableChoices(chapter01.nodes.TX_GLUCOSE, s).map(c => c.id)).toContain("hemin"); });
  it("records deterioration and significant delay while awaiting results", () => { const s = choose(state(), "wait-result"); expect(s.time).toBe(130); expect(s.flags.treatment_delay_significant).toBe(true); expect(s.patients.harin.diseaseStage).toBe("critical"); });
  it("confirms AHP at PBG without prematurely confirming AIP", () => { let s = state("PBG_RESULT"); expect(s.flags.acute_hepatic_porphyria_confirmed).toBe(true); expect(s.flags.aip_confirmed).not.toBe(true); expect(s.patients.harin.tests.urine_pbg_ala).toBe("positive"); s = enterNode(s, chapter01, "EP_001", 2); expect(s.flags.aip_confirmed).toBe(true); expect(s.values.final_diagnosis).toBe("acute_intermittent_porphyria"); });
  it.each([["validate", 8, true], ["clinical", 2, false], ["treat-first", -3, false]] as const)("applies disclosure %s trust", (id, delta, validation) => { const before = state("DISCLOSE_001"); const after = choose(before, id); expect(after.patients.harin.trust).toBe(before.patients.harin.trust + delta); expect(Boolean(after.flags.patient_validation_given)).toBe(validation); });
  it("repairs a family boundary only when the player apologizes", () => { const s = state("ETHICS_FAMILY"); s.flags.family_boundary_broken = true; const repaired = choose(s, "apologize"); expect(repaired.flags.patient_apology_given).toBe(true); expect(repaired.patients.harin.trust).toBe(s.patients.harin.trust + 8); const justified = choose(s, "justify"); expect(justified.flags.patient_apology_given).toBe(false); expect(classifyRelationship(justified)).toBe("broken"); });
  it.each([[false,false,"unknown"],[true,false,"partial"],[true,true,"sufficient"]] as const)("classifies trigger evidence", (diet, ocp, expected) => { const s = state(); s.flags.restricted_diet_known=diet; s.flags.ocp_known=ocp; expect(classifyTrigger(s)).toBe(expected); });
  it("classifies trusted, guarded, broken, and repaired relationships", () => {
    const s = state();
    s.patients.harin.trust = 60;
    expect(classifyRelationship(s)).toBe("trusted");
    s.flags.family_boundary_broken = true;
    s.flags.patient_apology_given = true;
    expect(classifyRelationship(s)).toBe("trusted");
    s.patients.harin.trust = 40;
    expect(classifyRelationship(s)).toBe("guarded");
    s.flags.patient_apology_given = false;
    expect(classifyRelationship(s)).toBe("broken");
    s.flags.family_boundary_broken = false;
    s.patients.harin.trust = 19;
    expect(classifyRelationship(s)).toBe("broken");
  });
  it("resolves endings in E, B, C, D, A priority", () => { expect(resolveEnding({diagnosis:"failed",treatment:"appropriate",trigger:"sufficient",relationship:"trusted"},true)).toBe("END_E"); expect(resolveEnding({diagnosis:"late",treatment:"delayed",trigger:"sufficient",relationship:"broken"},true)).toBe("END_B"); expect(resolveEnding({diagnosis:"appropriate",treatment:"delayed",trigger:"sufficient",relationship:"trusted"})).toBe("END_B"); expect(resolveEnding({diagnosis:"appropriate",treatment:"appropriate",trigger:"sufficient",relationship:"broken"})).toBe("END_C"); expect(resolveEnding({diagnosis:"appropriate",treatment:"appropriate",trigger:"partial",relationship:"trusted"})).toBe("END_D"); expect(resolveEnding({diagnosis:"appropriate",treatment:"appropriate",trigger:"sufficient",relationship:"trusted"})).toBe("END_A"); });

  it("keeps diagnosis and treatment outcome axes independent", () => {
    const s = state();
    s.values.diagnosis_outcome = "appropriate";
    s.values.treatment_timing = "delayed";
    s.flags.treatment_delay_significant = true;
    const context = endingContext(s);
    expect(context.diagnosis).toBe("appropriate");
    expect(context.treatment).toBe("delayed");
    expect(resolveEnding(context, true)).toBe("END_B");
  });

  it("routes delayed treatment to END_B before relationship or trigger endings", () => {
    const s = state("END_CALC");
    s.values.diagnosis_outcome = "appropriate";
    s.values.treatment_timing = "delayed";
    s.flags.restricted_diet_known = true;
    s.flags.ocp_known = true;
    s.patients.harin.trust = 80;
    const ids = getAvailableChoices(chapter01.nodes.END_CALC, s).map(c => c.id);
    expect(ids).toEqual(["delayed"]);
  });
  it("makes all five endings and completion graph-reachable", () => expect(validateChapterGraph(chapter01, ["END_A","END_B","END_C","END_D","END_E","CASE_COMPLETE"])).toEqual([]));
  it("lets the anchored route defer PBG and records diagnosis by another team", () => { let s=state("DX_PSYCH_REVIEW"); s.flags.diagnostic_anchoring=true; s=choose(s,"defer-pbg"); expect(s.currentNodeId).toBe("FAIL_001"); expect(s.values.diagnosis_outcome).toBe("failed"); expect(s.flags.pbg_positive).toBe(true); expect(s.flags.acute_hepatic_porphyria_confirmed).toBe(true); expect(s.flags.aip_confirmed).toBe(true); expect(s.patients.harin.tests.urine_pbg_ala).toBe("positive"); expect(s.patients.harin.tests.hmbs_variant).toBe("positive"); });
  it("builds a score-free archive from actual state", () => { const s=state(); Object.assign(s.flags,{restricted_diet_known:true,ocp_known:true}); s.values.treatment_timing="appropriate"; const archive=createChapter01Archive(s); expect(archive.trigger).toBe("sufficient"); expect(archive.triggersDiscovered).toHaveLength(2); expect(archive).not.toHaveProperty("score"); expect(archive).not.toHaveProperty("rank"); expect(endingContext(s).treatment).toBe("appropriate"); });
});

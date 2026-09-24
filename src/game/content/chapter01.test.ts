import { describe, expect, it } from "vitest";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { enterNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import type { GameState, PlayerState } from "@/game/types";
import { defaultPlayer, demoChapter } from "./demoChapter";
import { zeroResonance } from "@/game/abilities";

function chapterState(player: PlayerState = defaultPlayer): GameState {
  const base: GameState = {
    runId: "chapter-test", chapterId: demoChapter.id, currentNodeId: demoChapter.startNodeId,
    player, patients: demoChapter.initial!.patients!, flags: demoChapter.initial!.flags!,
    time: demoChapter.initial!.time!, resonance: zeroResonance(), values: {}, rngState: 1234, checkResults: {},
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
    state = executeChoice(state, demoChapter, "continue-ER_PAIN_02", 4);
    state = executeChoice(state, demoChapter, "ask-previous", 5);
    state = executeChoice(state, demoChapter, "return-pain", 6);
    expect(state.currentNodeId).toBe("ER_002");
    expect(getAvailableChoices(demoChapter.nodes.ER_002, state).map(({ id }) => id)).not.toContain("pain");
    expect(state.visitedNodeIds.filter((id) => id === "ER_002")).toHaveLength(2);
  });
});

describe("Chapter 1 hospital investigation", () => {
  const at = (id: string, state = chapterState()) => enterNode(state, demoChapter, id, 10);
  const abilities = (changes: Partial<PlayerState["abilities"]>): PlayerState => ({ ...defaultPlayer, abilities: { ...defaultPlayer.abilities, ...changes } });

  it("defines exactly the seven locked abilities and independent resonance", () => {
    expect(Object.keys(defaultPlayer.abilities)).toEqual(["observation", "history", "empathy", "mechanism", "reasoning", "suspicion", "decision"]);
    const changed = executeChoice(at("ER_005"), demoChapter, "valid", 11);
    expect(changed.resonance.empathy).toBe(1);
    expect(Object.entries(changed.resonance).filter(([key]) => key !== "empathy").every(([, value]) => value === 0)).toBe(true);
  });

  it("unlocks ER_003 after any three interviews and prevents repeats", () => {
    const current = chapterState();
    current.flags = { ...current.flags, er002_pain_complete: true, er002_gi_complete: true, er002_life_complete: true };
    const choices = getAvailableChoices(demoChapter.nodes.ER_002, current).map(({ id }) => id);
    expect(choices).toContain("proceed");
    expect(choices).not.toContain("pain");
  });

  it("resolves pain history both ways without blocking hub return", () => {
    for (const history of [20, -20]) {
      let current = at("ER_PAIN_02", chapterState(abilities({ history })));
      current = executeChoice(current, demoChapter, "ask-previous", 11);
      expect(["ER_PAIN_SUCCESS", "ER_PAIN_FAILURE"]).toContain(current.currentNodeId);
      current = executeChoice(current, demoChapter, "return-pain", 12);
      expect(current.currentNodeId).toBe("ER_002");
      expect(current.flags.er002_pain_complete).toBe(true);
    }
  });

  it("gates the expanded medication history on trust", () => {
    const low = at("ER_MED_01");
    expect(getAvailableChoices(demoChapter.nodes.ER_MED_01, low).map(c => c.id)).toContain("broaden-low");
    const high = structuredClone(low); high.patients.harin.trust = 55;
    expect(getAvailableChoices(demoChapter.nodes.ER_MED_01, high).map(c => c.id)).toContain("broaden");
  });

  it("requires abdominal and one other examination", () => {
    const current = at("ER_003");
    current.flags.exam_cv_complete = true; current.flags.exam_neuro_complete = true;
    expect(getAvailableChoices(demoChapter.nodes.ER_003, current).map(c => c.id)).not.toContain("proceed");
    current.flags.exam_abd_complete = true;
    expect(getAvailableChoices(demoChapter.nodes.ER_003, current).map(c => c.id)).toContain("proceed");
  });

  it.each([["good", -6, 0], ["other", 6, 0], ["valid", 10, 1]] as const)("applies ER_005 choice %s", (id, trustDelta, resonance) => {
    const current = at("ER_005"); const initial = current.patients.harin.trust;
    const result = executeChoice(current, demoChapter, id, 11);
    expect(result.patients.harin.trust).toBe(initial + trustDelta);
    expect(result.resonance.empathy).toBe(resonance);
  });

  it("converges every CT history route on CASE_001", () => {
    for (const id of ["records", "ask", "explain"]) {
      let current = executeChoice(at("CT_003"), demoChapter, id, 11);
      while (current.currentNodeId !== "CASE_001") current = executeChoice(current, demoChapter, getAvailableChoices(demoChapter.nodes[current.currentNodeId], current)[0].id, 12);
      expect(current.currentNodeId).toBe("CASE_001");
    }
  });

  it("combines the early motor hint with observation", () => {
    const current = chapterState(abilities({ observation: 3 })); current.flags.early_motor_hint = true;
    expect(at("ER_007", current).flags.early_weakness_known).toBe(true);
  });

  it("gates urine color at observation four", () => {
    expect(at("URINE_001", chapterState(abilities({ observation: 3 }))).flags.urine_color_known).toBe(false);
    expect(at("URINE_001", chapterState(abilities({ observation: 4 }))).flags.urine_color_known).toBe(true);
  });

  it.each([["empathy",20,"EMP_SUCCESS"], ["empathy",-20,"EMP_FAILURE"], ["history",20,"HIS_SUCCESS"], ["history",-20,"HIS_FAILURE"], ["suspicion",20,"SUS_SUCCESS"], ["suspicion",-20,"SUS_FAILURE"]] as const)("produces distinct %s check outcome", (ability, score, expected) => {
    const current = at("ER_009", chapterState(abilities({ [ability]: score })));
    expect(executeChoice(current, demoChapter, ability, 11).currentNodeId).toBe(expected);
  });

  it("deduplicates clues and a failed check can still reach FIELD_GATE", () => {
    let current = at("EXAM_CV_01"); current = enterNode(current, demoChapter, "EXAM_CV_01", 11);
    expect(current.patients.harin.clues.filter(id => id === "tachycardia")).toHaveLength(1);
    current = at("ER_009", chapterState(abilities({ empathy: -20 })));
    current = executeChoice(current, demoChapter, "empathy", 12);
    current = executeChoice(current, demoChapter, "continue-ER_010", 13);
    current = executeChoice(current, demoChapter, "continue-FIELD_GATE", 14);
    expect(current.currentNodeId).toBe("FIELD_GATE");
  });
});

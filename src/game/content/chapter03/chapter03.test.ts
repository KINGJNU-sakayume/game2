import { describe, expect, it } from "vitest";
import { classifyRelationship, classifyTrigger, createCaseArchive } from "@/game/engine/endingResolver";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { advanceTimedNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import { createRun, memoryFlag } from "@/game/engine/runFactory";
import type { GameState, PlayerState } from "@/game/types";
import { chapter03, chapter03Outcomes } from ".";
import { defaultPlayer } from "../chapter01";

const skilled: PlayerState = { ...defaultPlayer, abilities: { observation: 20, history: 20, empathy: 20, mechanism: 20, reasoning: 20, suspicion: 20, decision: 20 } };
const start = (player: PlayerState = skilled) => createRun(chapter03, player, { seed: 5, timestamp: 1 });
const ids = (state: GameState) => getAvailableChoices(chapter03.nodes[state.currentNodeId], state).map(({ id }) => id);

function play(state: GameState, script: string[]): GameState {
  let current = state;
  for (const step of script) {
    const node = chapter03.nodes[current.currentNodeId];
    if (step === "·") {
      current = node.autoNext ? advanceTimedNode(current, chapter03, current.updatedAt + 1) : executeChoice(current, chapter03, ids(current)[0], current.updatedAt + 1);
      continue;
    }
    expect(ids(current), `${current.currentNodeId} → ${step}`).toContain(step);
    current = executeChoice(current, chapter03, step, current.updatedAt + 1);
  }
  return current;
}

const toHub = ["·", "·", "·", "·", "to-patient", "·"];
const hub = ["fever", "return-fever", "travel", "return-travel", "skin", "return-skin", "proceed", "·", "vector"];
const search = ["search", "chaperone", "look", "·"];
const toField = ["doxy", "·", "·", "·", "·", "scrub", "already", "·"];
const field = ["neighbor", "warn", "·", "back"];
const close = ["·", "hidden", "brought-her", "·", "·", "·", "·"];

describe("Chapter 3 — 아무도 보지 않은 곳", () => {
  it("reaches ending A when the eschar is looked for with consent, doxycycline does not wait, and the neighbour is warned", () => {
    const state = play(start(), [...toHub, ...hub, ...search, ...toField, ...field, ...close]);
    expect(state.currentNodeId).toBe("END_CALC");
    expect(ids(state)).toEqual(["complete"]);
    const archive = createCaseArchive(state, chapter03);
    expect(archive).toMatchObject({ diagnosis: "appropriate", treatment: "appropriate", trigger: "sufficient", relationship: "trusted" });
    expect(archive.firstHypothesis).toBe("진드기 · 풀숲 매개 감염");
  });

  it("covers autumn fever after grass exposure empirically, even before the eschar is found", () => {
    const beforeSearch = play(start(), [...toHub, ...hub]);
    expect(beforeSearch.currentNodeId).toBe("ER_004");
    expect(ids(beforeSearch)).toContain("doxy");
    const noHistory = play(start(), [...toHub, "fever", "return-fever", "meds", "return-meds", "skin", "return-skin", "proceed", "·", "urosepsis"]);
    expect(ids(noHistory)).not.toContain("doxy");
    expect(ids(noHistory)).toContain("steroid");
  });

  it("never locks the eschar behind one roll: the nurse finds it at night, and the diagnosis is late", () => {
    const state = play(start(), [...toHub, ...hub, "ceftriaxone", "·", "·"]);
    expect(state.currentNodeId).toBe("DET_SEVERE");
    expect(state.flags.eschar_found_by_nurse).toBe(true);
    expect(state.patients.sunrye.clues).toContain("eschar");
    expect(state.values.diagnosis_outcome).toBe("late");
  });

  it("lets an early negative rapid test speak in chapter 1's voice", () => {
    const afterRdt = play(start(), [...toHub, ...hub, "rdt"]);
    expect(afterRdt.patients.sunrye.tests.scrub_rdt).toBe("negative");
    const voice = chapter03.nodes.RDT_001.blocks.find((block) => block.type === "thought" && block.label === "기억")!;
    expect(evaluateConditions(voice.conditions, afterRdt)).toBe(false);
    expect(evaluateConditions(voice.conditions, { ...afterRdt, flags: { ...afterRdt.flags, [memoryFlag("normal_is_not_diagnosis")]: true } })).toBe(true);
  });

  it("breaks the relationship when the exam skips her consent, and repairs it only with an apology", () => {
    const rushed = play(start(), [...toHub, ...hub, "search", "quick", "look", "·", ...toField, ...field, "·", "hidden", "brought-her", "dignity"]);
    expect(rushed.currentNodeId).toBe("ETHICS_DIGNITY");
    expect(classifyRelationship(executeChoice(rushed, chapter03, "justify", 99), chapter03Outcomes)).toBe("broken");
    expect(classifyRelationship(executeChoice(rushed, chapter03, "apologize", 99), chapter03Outcomes)).not.toBe("broken");
  });

  it("ends in the same grass when nobody traces who else sat there", () => {
    const state = play(start(), [...toHub, ...hub, ...search, ...toField, "clinic", "·", "back", ...close]);
    expect(classifyTrigger(state, chapter03Outcomes)).toBe("partial");
    expect(ids(state)).toEqual(["partial"]);
  });

  it("sends a team anchored on a drug reaction to the failure ending", () => {
    const withMeds = ["fever", "return-fever", "meds", "return-meds", "travel", "return-travel", "proceed", "·", "vector"];
    const anchored = play(start(), [...toHub, ...withMeds, "steroid", "·", "·", "·", "·", "·", "·", "dress", "anchor", "commit"]);
    expect(anchored.currentNodeId).toBe("FAIL_001");
    expect(anchored.values.diagnosis_outcome).toBe("failed");
    expect(anchored.flags.steroid_given).toBe(true);
  });

  it("makes waiting for antibodies a delayed, severe course", () => {
    const state = play(start(), [...toHub, ...hub, "ceftriaxone", "·", "·", "·", "ask-her", "·", "·", "scrub", "treat", "wait-ifa"]);
    expect(state.flags.treatment_delay_significant).toBe(true);
    expect(state.flags.airway_consented).toBe(true);
    expect(state.values.treatment_timing).toBe("delayed");
  });
});

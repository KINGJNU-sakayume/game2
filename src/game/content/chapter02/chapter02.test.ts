import { describe, expect, it } from "vitest";
import { classifyRelationship, classifyTrigger, createCaseArchive } from "@/game/engine/endingResolver";
import { advanceTimedNode, enterNode, executeChoice, getAvailableChoices } from "@/game/engine/nodeResolver";
import { createRun, memoryFlag } from "@/game/engine/runFactory";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import type { GameState, PlayerState } from "@/game/types";
import { chapter02, chapter02Outcomes } from ".";
import { defaultPlayer } from "../chapter01";

const skilled: PlayerState = { ...defaultPlayer, abilities: { observation: 20, history: 20, empathy: 20, mechanism: 20, reasoning: 20, suspicion: 20, decision: 20 } };
const start = (player: PlayerState = skilled) => createRun(chapter02, player, { seed: 11, timestamp: 1 });
const ids = (state: GameState) => getAvailableChoices(chapter02.nodes[state.currentNodeId], state).map(({ id }) => id);

/** Plays choice IDs in order; a lone forward step and timed cards are taken automatically with "·". */
function play(state: GameState, script: string[]): GameState {
  let current = state;
  for (const step of script) {
    const node = chapter02.nodes[current.currentNodeId];
    if (step === "·") {
      current = node.autoNext ? advanceTimedNode(current, chapter02, current.updatedAt + 1) : executeChoice(current, chapter02, ids(current)[0], current.updatedAt + 1);
      continue;
    }
    expect(ids(current), `${current.currentNodeId} → ${step}`).toContain(step);
    current = executeChoice(current, chapter02, step, current.updatedAt + 1);
  }
  return current;
}

const toHub = ["·", "·", "·", "·", "·", "to-child", "·"];
const hub = ["gi", "return-gi", "mother", "mom-press", "return-mother", "home", "return-home", "proceed", "·"];
const toResult = ["environmental", "cohb", "o2-now", "·", "·", "·", "·", "co", "result", "·"];
const chamber = ["both", "persuade", "·"];
const field = ["home", "safe", "·", "boiler", "return", "leave", "·", "hospital"];
const aftercare = ["defer", "·", "flue", "·", "support", "·", "·", "·", "·"];

describe("Chapter 2 — 창문을 닫은 방", () => {
  it("reaches ending A when the room is found, oxygen does not wait, and the mother is heard", () => {
    const state = play(start(), [...toHub, ...hub, ...toResult, ...chamber, ...field, ...aftercare]);
    expect(state.currentNodeId).toBe("END_CALC");
    expect(ids(state)).toEqual(["complete"]);
    const archive = createCaseArchive(state, chapter02);
    expect(archive).toMatchObject({ diagnosis: "appropriate", treatment: "appropriate", trigger: "sufficient", relationship: "trusted" });
    expect(archive.triggersDiscovered).toEqual(["보일러 배기통 이탈", "밀폐된 방 · 환기 차단"]);
    expect(archive.firstHypothesis).toBe("환경 노출");
  });

  it("offers COHb before the collapse only to a player who connected both people and the room", () => {
    const blind = play(start({ ...defaultPlayer, abilities: { ...defaultPlayer.abilities, mechanism: 2 } }), ["·", "·", "·", "·", "·", "to-resident", "gi", "return-gi", "neuro", "return-neuro", "home", "return-home", "proceed", "·", "gastroenteritis"]);
    expect(blind.currentNodeId).toBe("ER_004");
    expect(ids(blind)).not.toContain("cohb");
    const connected = play(start(), [...toHub, ...hub, "gastroenteritis"]);
    expect(ids(connected)).toContain("cohb");
  });

  it("keeps a normal saturation visible as a trap and lets chapter 1's memory speak", () => {
    const withMemory = { ...start(), flags: { ...start().flags, [memoryFlag("normal_is_not_diagnosis")]: true } };
    const memoryBlock = chapter02.nodes.ER_003.blocks.find((block) => block.type === "thought" && block.label === "기억")!;
    expect(evaluateConditions(memoryBlock.conditions, start())).toBe(false);
    expect(evaluateConditions(memoryBlock.conditions, withMemory)).toBe(true);
    expect(chapter02.nodes.ER_001.presentation?.clinicalData?.find(({ label }) => label === "SpO2")?.value).toBe("99%");
  });

  it("respects a mother who declines the chamber without calling the team's timing late", () => {
    const refusing: PlayerState = { ...skilled, abilities: { ...skilled.abilities, empathy: -20, decision: -20 } };
    const state = play(start(refusing), [...toHub, "gi", "return-gi", "neuro", "return-neuro", "home", "return-home", "proceed", "·", ...toResult, "both", "persuade"]);
    expect(state.currentNodeId).toBe("HBOT_REFUSED");
    expect(state.flags.mother_declined_hbot).toBe(true);
    expect(state.values.treatment_timing).toBe("appropriate");
  });

  it("routes waiting on oxygen to the delayed ending", () => {
    const state = play(start(), [...toHub, ...hub, "environmental", "cohb", "o2-wait", "·", "·", "·", "co", "result", "·", ...chamber, ...field, ...aftercare]);
    expect(state.values.treatment_timing).toBe("delayed");
    expect(ids(state)).toEqual(["delayed"]);
  });

  it("breaks the relationship on a report made without her, unless the player owns it", () => {
    const beforeSocial = play(start(), [...toHub, ...hub, ...toResult, ...chamber, ...field, "defer", "·", "flue", "·", "report", "insist"]);
    expect(beforeSocial.flags.reported_without_consent).toBe(true);
    expect(classifyRelationship(beforeSocial, chapter02Outcomes)).toBe("broken");
    const repaired = executeChoice(beforeSocial, chapter02, "repair", 99);
    expect(classifyRelationship(repaired, chapter02Outcomes)).not.toBe("broken");
  });

  it("leaves the exposure source partial when nobody goes into the room", () => {
    const state = play(start(), [...toHub, ...hub, ...toResult, ...chamber, "center", "·", "hospital", "defer", "·", "not-fault", "·", "support", "·", "·", "·", "·"]);
    expect(classifyTrigger(state, chapter02Outcomes)).toBe("partial");
    expect(ids(state)).toEqual(["partial"]);
  });

  it("sends an anchored team to the failure ending through a second exposure", () => {
    const anchored = play(start(), [...toHub, ...hub, "gastroenteritis", "fluids", "·", "·", "·", "·", "stress", "anchor", "discharge"]);
    expect(anchored.currentNodeId).toBe("FAIL_001");
    expect(anchored.values.diagnosis_outcome).toBe("failed");
    expect(play(anchored, ["·"]).currentNodeId).toBe("END_CALC");
  });

  it("stages the rushed entry as a risk to the investigator, not a shortcut", () => {
    const atDoor = enterNode(start(), chapter02, "HOME_001", 5);
    const rushed = executeChoice(atDoor, chapter02, "rush", 6);
    expect(rushed.flags.investigator_exposed).toBe(true);
    expect(rushed.time).toBeGreaterThan(atDoor.time);
  });
});

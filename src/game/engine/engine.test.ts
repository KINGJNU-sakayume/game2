import { describe, expect, it } from "vitest";
import { resolveCheck } from "./checkResolver";
import { evaluateCondition } from "./conditionResolver";
import { applyEffects } from "./effectResolver";
import { enterNode, executeChoice, getAvailableChoices } from "./nodeResolver";
import type { ChapterDefinition, GameState } from "@/game/types";

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    runId: "run", chapterId: "chapter", currentNodeId: "start",
    player: { name: "P", abilities: { observation: 2, empathy: 1, reasoning: 0, resolve: -1 } },
    patients: { p: { id: "p", name: "Patient", trust: 50, diseaseStage: "latent", clues: [], diagnoses: [], tests: {} } },
    flags: {}, time: 0, resonance: 0, rngState: 42, checkResults: {}, visitedNodeIds: [], nodeEnteredAt: 0, updatedAt: 0,
    ...overrides,
  };
}

describe("conditions and effects", () => {
  it("clamps trust and evaluates thresholds", () => {
    const high = applyEffects(state(), [{ type: "trust", patientId: "p", amount: 80 }]);
    expect(high.patients.p.trust).toBe(100);
    expect(evaluateCondition({ type: "trust", patientId: "p", operator: "gte", value: 100 }, high)).toBe(true);
    const low = applyEffects(high, [{ type: "trust", patientId: "p", amount: -150 }]);
    expect(low.patients.p.trust).toBe(0);
  });
});

describe("node resolver", () => {
  const chapter: ChapterDefinition = {
    id: "chapter", title: "Test", startNodeId: "start", nodes: {
      start: { id: "start", blocks: [], onExit: [{ type: "flag", key: "left", value: true }], choices: [
        { id: "hidden", label: "Hidden", conditions: [{ type: "flag", key: "open" }], next: "end" },
        { id: "check", label: "Check", effects: [{ type: "time", amount: 1 }], timeCost: 2, check: { id: "c1", ability: "observation", dc: 9, modifiers: 2 }, next: { success: "success", failure: "failure" } },
      ] },
      success: { id: "success", blocks: [], autoNext: "end", onEnter: [{ type: "flag", key: "won", value: true }] },
      failure: { id: "failure", blocks: [] },
      end: { id: "end", blocks: [] },
      locked: { id: "locked", conditions: [{ type: "flag", key: "never" }], blocks: [] },
    },
  };

  it("enters unconditional nodes, rejects conditional nodes, and follows autoNext", () => {
    expect(enterNode(state(), chapter, "end", 10).currentNodeId).toBe("end");
    expect(() => enterNode(state(), chapter, "locked", 10)).toThrow("Conditions not met");
    const result = enterNode(state(), chapter, "success", 10);
    expect(result.currentNodeId).toBe("end");
    expect(result.flags.won).toBe(true);
    expect(result.visitedNodeIds).toEqual(["success", "end"]);
  });

  it("hides choices whose conditions fail", () => {
    expect(getAvailableChoices(chapter.nodes.start, state()).map(({ id }) => id)).toEqual(["check"]);
  });

  it("applies modifiers, cost, effects, branch, timestamps and exit effects", () => {
    const result = executeChoice(state(), chapter, "check", 123);
    const check = result.checkResults.c1;
    expect(check.total).toBe(check.rolls[0] + check.rolls[1] + 2 + 2);
    expect(result.currentNodeId).toBe(check.success ? "end" : "failure");
    expect(result.time).toBe(3);
    expect(result.flags.left).toBe(true);
    expect(result.updatedAt).toBe(123);
  });

  it("selects both success and failure destinations from check results", () => {
    const successChoice = chapter.nodes.start.choices![1];
    const successChapter = { ...chapter, nodes: { ...chapter.nodes, start: { ...chapter.nodes.start, choices: [{ ...successChoice, check: { ...successChoice.check!, dc: 2 } }] } } };
    const failureChapter = { ...chapter, nodes: { ...chapter.nodes, start: { ...chapter.nodes.start, choices: [{ ...successChoice, check: { ...successChoice.check!, dc: 99 } }] } } };
    expect(executeChoice(state(), successChapter, "check", 1).currentNodeId).toBe("end");
    expect(executeChoice(state(), failureChapter, "check", 1).currentNodeId).toBe("failure");
  });
});

describe("deterministic checks", () => {
  it("reproduces rolls from a seed and returns the updated state", () => {
    const one = resolveCheck({ id: "x", ability: "empathy", dc: 7 }, state({ rngState: 9182 }), 1);
    const two = resolveCheck({ id: "x", ability: "empathy", dc: 7 }, state({ rngState: 9182 }), 1);
    expect(one.result).toEqual(two.result);
    expect(one.rngState).toBe(two.rngState);
    expect(one.rngState).not.toBe(9182);
  });

  it("reuses a stored first result without consuming RNG", () => {
    const first = resolveCheck({ id: "x", ability: "resolve", dc: 20 }, state(), 1);
    const cachedState = state({ rngState: first.rngState, checkResults: { x: first.result } });
    const again = resolveCheck({ id: "x", ability: "resolve", dc: 2 }, cachedState, 999);
    expect(again.cached).toBe(true);
    expect(again.result).toBe(first.result);
    expect(again.rngState).toBe(first.rngState);
  });
});

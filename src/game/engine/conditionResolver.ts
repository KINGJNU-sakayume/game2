import type { ComparisonOperator, Condition, GameState } from "@/game/types";

function compare(actual: number, operator: ComparisonOperator = "gte", expected: number): boolean {
  switch (operator) {
    case "eq": return actual === expected;
    case "neq": return actual !== expected;
    case "gt": return actual > expected;
    case "gte": return actual >= expected;
    case "lt": return actual < expected;
    case "lte": return actual <= expected;
  }
}

export function evaluateCondition(condition: Condition, state: GameState): boolean {
  switch (condition.type) {
    case "all": return evaluateConditions(condition.conditions, state);
    case "any": return condition.conditions.some((item) => evaluateCondition(item, state));
    case "flagCount": return compare(condition.keys.filter((key) => state.flags[key]).length, condition.operator, condition.value);
    case "value": {
      const actual = state.values[condition.key];
      if (typeof condition.value === "number" && (typeof actual === "number" || actual === undefined)) {
        return compare(typeof actual === "number" ? actual : 0, condition.operator ?? "eq", condition.value);
      }
      return condition.operator === "neq" ? actual !== condition.value : actual === condition.value;
    }
    case "flag":
      return Boolean(state.flags[condition.key]) === (condition.value ?? true);
    case "ability":
      return compare(state.player.abilities[condition.ability], condition.operator, condition.value);
    case "trust":
      return compare(state.patients[condition.patientId]?.trust ?? 0, condition.operator, condition.value);
    case "clue": {
      const found = condition.patientId
        ? state.patients[condition.patientId]?.clues.includes(condition.clueId) ?? false
        : Object.values(state.patients).some((patient) => patient.clues.includes(condition.clueId));
      return found === (condition.present ?? true);
    }
    case "diagnosis": {
      const found = condition.patientId
        ? state.patients[condition.patientId]?.diagnoses.includes(condition.diagnosisId) ?? false
        : Object.values(state.patients).some((patient) => patient.diagnoses.includes(condition.diagnosisId));
      return found === (condition.present ?? true);
    }
    case "time":
      return compare(state.time, condition.operator, condition.value);
    case "test": {
      const statuses = condition.patientId
        ? [state.patients[condition.patientId]?.tests[condition.testId]]
        : Object.values(state.patients).map((patient) => patient.tests[condition.testId]);
      return condition.status ? statuses.includes(condition.status) : statuses.some(Boolean);
    }
  }
}

export function evaluateConditions(conditions: readonly Condition[] | undefined, state: GameState): boolean {
  return conditions?.every((condition) => evaluateCondition(condition, state)) ?? true;
}

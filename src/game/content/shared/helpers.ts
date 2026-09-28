import type { AbilityName, Choice, ComparisonOperator, Condition, DiseaseStage, Effect, NarrativeBlock, TimelineEntry } from "@/game/types";

/**
 * Authoring vocabulary shared by every chapter. Keep content files declarative:
 * a node should read like a script, not like engine code.
 */

/** Speaker name of the player character. Rendered as the first-person voice. */
export const PLAYER = "나";

// ── Blocks ──────────────────────────────────────────────────────────────────
export const p = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "prose", text, conditions });
export const d = (speaker: string, text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "dialogue", speaker, text, conditions });
export const me = (text: string, conditions?: Condition[]): NarrativeBlock => d(PLAYER, text, conditions);
/** Lab values, monitor readouts, records: rendered as a printed slip. */
export const s = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "system", text, conditions, variant: "readout" });
/** A large time or date stamp between beats (e.g. "19:42"). */
export const stamp = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "system", text, conditions, variant: "stamp" });
/** A handwritten-style note: instructions, messages, a line on a chart. */
export const note = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "system", text, conditions, variant: "note" });
/** An inner voice. With a threshold it only speaks when the ability is high enough. */
export const thought = (ability: AbilityName, text: string, threshold?: number): NarrativeBlock => ({
  type: "thought", ability, text, conditions: threshold === undefined ? undefined : [atLeast(ability, threshold)],
});
/** An inner voice with arbitrary conditions. */
export const voice = (ability: AbilityName, text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "thought", ability, text, conditions });

// ── Conditions ──────────────────────────────────────────────────────────────
export const atLeast = (name: AbilityName, value: number): Condition => ({ type: "ability", ability: name, operator: "gte", value });
export const flag = (key: string, value = true): Condition => ({ type: "flag", key, value });
export const not = (condition: Condition): Condition => ({ type: "not", condition });
export const all = (...conditions: Condition[]): Condition => ({ type: "all", conditions });
export const any = (...conditions: Condition[]): Condition => ({ type: "any", conditions });
export const trustIs = (patientId: string, operator: ComparisonOperator, value: number): Condition => ({ type: "trust", patientId, operator, value });
export const valueIs = (key: string, value: string | number | boolean): Condition => ({ type: "value", key, value });
export const valueNot = (key: string, value: string | number | boolean): Condition => ({ type: "value", key, value, operator: "neq" });
export const valueAtLeast = (key: string, value: number): Condition => ({ type: "value", key, operator: "gte", value });
export const valueBelow = (key: string, value: number): Condition => ({ type: "value", key, operator: "lt", value });
export const hasClue = (clueId: string, present = true): Condition => ({ type: "clue", clueId, present });
export const timeAtLeast = (value: number): Condition => ({ type: "time", operator: "gte", value });
export const testIs = (testId: string, status: "ordered" | "pending" | "complete" | "positive" | "negative"): Condition => ({ type: "test", testId, status });

// ── Effects ─────────────────────────────────────────────────────────────────
export const setFlag = (key: string, value = true): Effect => ({ type: "flag", key, value });
export const setValue = (key: string, value: string | number | boolean): Effect => ({ type: "value", key, value });
export const addValue = (key: string, amount: number): Effect => ({ type: "valueIncrement", key, amount });
export const trust = (patientId: string, amount: number): Effect => ({ type: "trust", patientId, amount });
export const clueOf = (patientId: string, clueId: string): Effect => ({ type: "clue", patientId, clueId });
export const addDiagnosis = (patientId: string, diagnosisId: string): Effect => ({ type: "diagnosis", patientId, diagnosisId });
export const primary = (diagnosisId: string): Effect[] => [setValue("primary_diagnosis", diagnosisId), { type: "primaryDiagnosis", diagnosisId }];
export const test = (patientId: string, testId: string, status: "ordered" | "pending" | "complete" | "positive" | "negative"): Effect => ({ type: "test", patientId, testId, status });
export const stage = (patientId: string, value: DiseaseStage): Effect => ({ type: "disease", patientId, stage: value });
export const minutes = (amount: number): Effect => ({ type: "time", amount });
export const clockTo = (value: number): Effect => ({ type: "advanceToTime", value });
export const resonate = (ability: AbilityName, amount = 1): Effect => ({ type: "resonance", ability, amount });
export const when = (conditions: Condition[], effects: Effect[]): Effect => ({ type: "conditional", conditions, effects });
export const log = (id: string, text: string, kind: TimelineEntry["kind"] = "clinical", time?: number): Effect => ({ type: "timeline", entry: { id, kind, text, time } });

// ── Choices ─────────────────────────────────────────────────────────────────
/** A single forward step. Rendered as tap-to-advance, never as a button. */
export const go = (next: string, label = "계속"): Choice[] => [{ id: `continue-${next}`, label, next }];

/** Clock helper: `at(19, 42)` → minutes since midnight. */
export const at = (hours: number, mins = 0) => hours * 60 + mins;

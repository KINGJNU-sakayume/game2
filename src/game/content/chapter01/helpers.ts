import type { AbilityName, Condition, Effect, NarrativeBlock } from "@/game/types";

export const HARIN = "harin";
export const d = (speaker: string, text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "dialogue", speaker, text, conditions });
export const p = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "prose", text, conditions });
export const s = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "system", text, conditions });
export const ability = (name: AbilityName, value: number): Condition => ({ type: "ability", ability: name, operator: "gte", value });
export const thought = (abilityName: AbilityName, text: string, threshold?: number): NarrativeBlock => ({ type: "thought", ability: abilityName, text, conditions: threshold === undefined ? undefined : [ability(abilityName, threshold)] });
export const flag = (key: string, value = true): Condition => ({ type: "flag", key, value });
export const setFlag = (key: string, value = true): Effect => ({ type: "flag", key, value });
export const clue = (clueId: string): Effect => ({ type: "clue", patientId: HARIN, clueId });
export const valueAtLeast = (key: string, value: number): Condition => ({ type: "value", key, operator: "gte", value });
export const valueBelow = (key: string, value: number): Condition => ({ type: "value", key, operator: "lt", value });
export const go = (next: string, label = "계속") => [{ id: `continue-${next}`, label, next }];

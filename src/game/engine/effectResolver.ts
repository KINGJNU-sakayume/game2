import type { Effect, GameState, PatientState } from "@/game/types";
import { evaluateConditions } from "./conditionResolver";
import { appendTimeline } from "@/game/state/caseState";

const clampTrust = (value: number) => Math.min(100, Math.max(0, value));

export function applyEffect(state: GameState, effect: Effect): GameState {
  if (effect.type === "timeline") {
    const timeline = appendTimeline(state.timeline ?? [], effect.entry);
    return timeline === state.timeline ? state : { ...state, timeline };
  }
  if (effect.type === "conditional") return evaluateConditions(effect.conditions, state) ? applyEffects(state, effect.effects) : state;
  if (effect.type === "flag") return { ...state, flags: { ...state.flags, [effect.key]: effect.value } };
  if (effect.type === "value") return { ...state, values: { ...state.values, [effect.key]: effect.value } };
  if (effect.type === "valueIncrement") {
    const current = state.values[effect.key];
    return { ...state, values: { ...state.values, [effect.key]: (typeof current === "number" ? current : 0) + effect.amount } };
  }
  if (effect.type === "increment") return {
    ...state,
    player: { ...state.player, abilities: { ...state.player.abilities, [effect.ability]: state.player.abilities[effect.ability] + effect.amount } },
  };
  if (effect.type === "time") return { ...state, time: state.time + effect.amount };
  if (effect.type === "setTime") return { ...state, time: effect.value };
  if (effect.type === "advanceToTime") return { ...state, time: Math.max(state.time, effect.value) };
  if (effect.type === "resonance") return { ...state, resonance: { ...state.resonance, [effect.ability]: state.resonance[effect.ability] + effect.amount } };

  const patient = state.patients[effect.patientId];
  if (!patient) return state;
  let updated: PatientState;
  switch (effect.type) {
    case "trust": updated = { ...patient, trust: clampTrust(patient.trust + effect.amount) }; break;
    case "clue": updated = { ...patient, clues: effect.remove ? patient.clues.filter((id) => id !== effect.clueId) : [...new Set([...patient.clues, effect.clueId])] }; break;
    case "diagnosis": {
      const diagnoses = effect.remove ? patient.diagnoses.filter((id) => id !== effect.diagnosisId) : [...new Set([...patient.diagnoses, effect.diagnosisId])];
      const current = state.diagnosisState?.[effect.diagnosisId];
      const diagnosisState = effect.remove ? state.diagnosisState : { ...(state.diagnosisState ?? {}), [effect.diagnosisId]: current ? { ...current, unlocked: true } : { unlocked: true, isPrimary: false, linkedClues: [], order: Object.keys(state.diagnosisState ?? {}).length } };
      updated = { ...patient, diagnoses };
      return { ...state, diagnosisState, patients: { ...state.patients, [effect.patientId]: updated } };
    }
    case "test": updated = { ...patient, tests: { ...patient.tests, [effect.testId]: effect.status } }; break;
    case "disease": updated = { ...patient, diseaseStage: effect.stage }; break;
  }
  return { ...state, patients: { ...state.patients, [effect.patientId]: updated } };
}

export function applyEffects(state: GameState, effects: readonly Effect[] | undefined): GameState {
  return effects?.reduce(applyEffect, state) ?? state;
}

import type { Effect, GameState, PatientState } from "@/game/types";

const clampTrust = (value: number) => Math.min(100, Math.max(0, value));

export function applyEffect(state: GameState, effect: Effect): GameState {
  if (effect.type === "flag") return { ...state, flags: { ...state.flags, [effect.key]: effect.value } };
  if (effect.type === "increment") return {
    ...state,
    player: { ...state.player, abilities: { ...state.player.abilities, [effect.ability]: state.player.abilities[effect.ability] + effect.amount } },
  };
  if (effect.type === "time") return { ...state, time: state.time + effect.amount };
  if (effect.type === "resonance") return { ...state, resonance: state.resonance + effect.amount };

  const patient = state.patients[effect.patientId];
  if (!patient) return state;
  let updated: PatientState;
  switch (effect.type) {
    case "trust": updated = { ...patient, trust: clampTrust(patient.trust + effect.amount) }; break;
    case "clue": updated = { ...patient, clues: effect.remove ? patient.clues.filter((id) => id !== effect.clueId) : [...new Set([...patient.clues, effect.clueId])] }; break;
    case "diagnosis": updated = { ...patient, diagnoses: effect.remove ? patient.diagnoses.filter((id) => id !== effect.diagnosisId) : [...new Set([...patient.diagnoses, effect.diagnosisId])] }; break;
    case "test": updated = { ...patient, tests: { ...patient.tests, [effect.testId]: effect.status } }; break;
    case "disease": updated = { ...patient, diseaseStage: effect.stage }; break;
  }
  return { ...state, patients: { ...state.patients, [effect.patientId]: updated } };
}

export function applyEffects(state: GameState, effects: readonly Effect[] | undefined): GameState {
  return effects?.reduce(applyEffect, state) ?? state;
}

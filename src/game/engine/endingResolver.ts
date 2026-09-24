import type { ArchiveDefinition, CaseArchive, EndingContext, GameState, RelationshipOutcome, TriggerOutcome } from "@/game/types";

export function classifyTrigger(state: GameState): TriggerOutcome {
  const count = Number(Boolean(state.flags.restricted_diet_known)) + Number(Boolean(state.flags.ocp_known));
  return count === 2 ? "sufficient" : count === 1 ? "partial" : "unknown";
}

export function classifyRelationship(state: GameState): RelationshipOutcome {
  const trust = state.patients.harin?.trust ?? 0;
  const unresolvedBoundary = state.flags.family_boundary_broken && !state.flags.patient_apology_given;
  if (trust < 20 || unresolvedBoundary) return "broken";
  if (trust >= 60) return "trusted";
  return "guarded";
}

export function endingContext(state: GameState): EndingContext {
  const recordedDiagnosis = state.values.diagnosis_outcome;
  const diagnosis = recordedDiagnosis === "failed" || recordedDiagnosis === "late" || recordedDiagnosis === "appropriate"
    ? recordedDiagnosis
    : "appropriate";
  return {
    diagnosis,
    treatment: state.values.treatment_timing === "appropriate" ? "appropriate" : "delayed",
    trigger: classifyTrigger(state), relationship: classifyRelationship(state),
  };
}

/** Generic priority resolver; it knows only outcome axes, never chapter flags. */
export function resolveEnding(context: EndingContext, severeDelay = false): string {
  if (context.diagnosis === "failed") return "END_E";
  if (severeDelay || context.diagnosis === "late" || context.treatment === "delayed") return "END_B";
  if (context.relationship === "broken") return "END_C";
  if (context.trigger !== "sufficient") return "END_D";
  return "END_A";
}

export function createArchive(state: GameState, definition: ArchiveDefinition): CaseArchive {
  const context = endingContext(state); const endingId = String(state.values.ending_id || resolveEnding(context, Boolean(state.flags.treatment_delay_significant)));
  return {
    ...definition,
    ...context, triggersDiscovered: [state.flags.restricted_diet_known && "심한 열량 제한", state.flags.ocp_known && "호르몬 노출"].filter(Boolean) as string[],
    outcome: endingId === "END_B" ? "잔여 근력저하로 보행 재활 필요" : endingId === "END_E" ? "다른 진료팀의 재평가로 진단" : "급성 발작 치료 후 회복",
    followUp: context.relationship === "broken" ? "다른 진료팀으로 후속 진료 전환" : context.relationship === "trusted" ? "환자 메시지와 외래 추적" : "외래 기록으로 추적", endingId,
  };
}

export const chapter01ArchiveDefinition: ArchiveDefinition = { caseId: "CASE 01", title: "아무것도 없는 배", finalDiagnosis: "급성 간헐성 포르피린증 / Acute Intermittent Porphyria", biochemicalDiagnosis: "소변 PBG/ALA 상승으로 확인된 급성 간성 포르피린증", subtypeConfirmation: "HMBS pathogenic variant", complications: ["저나트륨혈증", "운동신경병증", "신경정신 증상"] };
export const createChapter01Archive = (state: GameState): CaseArchive => createArchive(state, chapter01ArchiveDefinition);

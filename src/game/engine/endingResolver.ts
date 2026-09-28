import type { CaseArchive, ChapterDefinition, EndingContext, EndingId, GameState, OutcomeRules, RelationshipOutcome, TriggerOutcome } from "@/game/types";

/**
 * Generic outcome axes. Chapters describe *which* flags and people matter through
 * OutcomeRules; the resolver itself never names chapter content.
 *
 * Value contract every chapter writes during play:
 * - `diagnosis_outcome`: "appropriate" | "late" | "failed"
 * - `treatment_timing`: "appropriate" | "delayed"
 * - `ending_id`: the ending node the chapter routed to
 */
export function classifyTrigger(state: GameState, rules: OutcomeRules): TriggerOutcome {
  const known = rules.triggers.filter(({ flag }) => state.flags[flag]).length;
  if (known === 0) return "unknown";
  return known === rules.triggers.length ? "sufficient" : "partial";
}

export function classifyRelationship(state: GameState, rules: OutcomeRules): RelationshipOutcome {
  const trust = state.patients[rules.patientId]?.trust ?? 0;
  const { brokenBelow, trustedAt, boundaryFlag, repairFlag } = rules.relationship;
  const unresolvedBoundary = Boolean(boundaryFlag && state.flags[boundaryFlag] && !(repairFlag && state.flags[repairFlag]));
  if (trust < brokenBelow || unresolvedBoundary) return "broken";
  if (trust >= trustedAt) return "trusted";
  return "guarded";
}

export function endingContext(state: GameState, rules: OutcomeRules): EndingContext {
  const recorded = state.values.diagnosis_outcome;
  const diagnosis = recorded === "failed" || recorded === "late" || recorded === "appropriate" ? recorded : "appropriate";
  return {
    diagnosis,
    treatment: state.values.treatment_timing === "appropriate" ? "appropriate" : "delayed",
    trigger: classifyTrigger(state, rules),
    relationship: classifyRelationship(state, rules),
  };
}

/** Generic priority resolver; it knows only outcome axes, never chapter flags. */
export function resolveEnding(context: EndingContext, severeDelay = false): EndingId {
  if (context.diagnosis === "failed") return "END_E";
  if (severeDelay || context.diagnosis === "late" || context.treatment === "delayed") return "END_B";
  if (context.relationship === "broken") return "END_C";
  if (context.trigger !== "sufficient") return "END_D";
  return "END_A";
}

const isEndingId = (value: unknown): value is EndingId =>
  value === "END_A" || value === "END_B" || value === "END_C" || value === "END_D" || value === "END_E";

/** Used only when a chapter completes without authored outcome rules (content lint flags this). */
const fallbackRules = (patientId: string): OutcomeRules => ({
  patientId,
  triggers: [],
  relationship: { brokenBelow: 20, trustedAt: 60 },
  outcomeText: { END_A: "회복", END_B: "지연된 회복", END_C: "회복", END_D: "회복", END_E: "다른 진료팀의 재평가로 진단" },
  followUpText: { trusted: "외래 추적", guarded: "외래 기록으로 추적", broken: "다른 진료팀으로 후속 진료 전환" },
});

export function createCaseArchive(state: GameState, chapter: ChapterDefinition): CaseArchive {
  const definition = chapter.completion?.archive;
  if (!definition) throw new Error(`Chapter ${chapter.id} has no completion archive`);
  const rules = chapter.outcomes ?? fallbackRules(Object.keys(state.patients)[0] ?? "");
  const context = endingContext(state, rules);
  const severeDelay = Boolean(rules.severeDelayFlag && state.flags[rules.severeDelayFlag]);
  const endingId = isEndingId(state.values.ending_id) ? state.values.ending_id : resolveEnding(context, severeDelay);
  const hypothesisKey = definition.firstHypothesis ? state.values[definition.firstHypothesis.valueKey] : undefined;
  return {
    caseId: definition.caseId,
    title: definition.title,
    finalDiagnosis: definition.finalDiagnosis,
    biochemicalDiagnosis: definition.biochemicalDiagnosis,
    subtypeConfirmation: definition.subtypeConfirmation,
    complications: [...definition.complications],
    ...context,
    triggersDiscovered: rules.triggers.filter(({ flag }) => state.flags[flag]).map(({ label }) => label),
    outcome: rules.outcomeText[endingId],
    followUp: rules.followUpText[rules.transferFlag && state.flags[rules.transferFlag] ? "broken" : context.relationship],
    endingId,
    endingTitle: chapter.nodes[endingId]?.title,
    firstHypothesis: hypothesisKey === undefined ? undefined : definition.firstHypothesis?.labels[String(hypothesisKey)],
    chapterId: chapter.id,
  };
}

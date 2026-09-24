export const ABILITY_NAMES = ["observation", "history", "empathy", "mechanism", "reasoning", "suspicion", "decision"] as const;
export type AbilityName = (typeof ABILITY_NAMES)[number];
export type DiseaseStage = "latent" | "early" | "progressing" | "critical";

export interface PlayerState {
  name: string;
  abilities: Record<AbilityName, number>;
}

export interface PatientState {
  id: string;
  name: string;
  trust: number;
  diseaseStage: DiseaseStage;
  clues: string[];
  diagnoses: string[];
  tests: Record<string, "ordered" | "pending" | "complete" | "positive" | "negative">;
}

export type ClueCategory = "clinical" | "lab" | "history" | "environment";
export interface ClueDefinition { id: string; title: string; description?: string; category: ClueCategory; tags?: string[] }
export interface DiagnosisRule { text: string; conditions?: Condition[] }
export interface DiagnosisDefinition {
  id: string; nameKo: string; nameEn?: string; category?: string;
  supportRules?: DiagnosisRule[]; contradictionRules?: DiagnosisRule[]; unknownRules?: DiagnosisRule[];
}
export interface TestDefinition { id: string; nameKo: string; nameEn?: string }
export interface DiagnosisState { unlocked: boolean; isPrimary: boolean; linkedClues: string[]; order: number }
export interface TimelineEntry { id: string; time: number; kind: "clinical" | "decision" | "test" | "field" | "relationship"; text: string }
export type TimelineEffectEntry = Omit<TimelineEntry, "time"> & { time?: number };
export interface ClinicalDatum { label: string; value: string; tone?: "default" | "warning" | "critical" }

export interface CheckResult {
  checkId: string;
  rolls: readonly [number, number];
  ability: AbilityName;
  abilityModifier: number;
  modifiers: number;
  total: number;
  dc: number;
  success: boolean;
  timestamp: number;
}

export type Condition =
  | { type: "flag"; key: string; value?: boolean }
  | { type: "ability"; ability: AbilityName; operator?: ComparisonOperator; value: number }
  | { type: "trust"; patientId: string; operator?: ComparisonOperator; value: number }
  | { type: "clue"; patientId?: string; clueId: string; present?: boolean }
  | { type: "diagnosis"; patientId?: string; diagnosisId: string; present?: boolean }
  | { type: "time"; operator?: ComparisonOperator; value: number }
  | { type: "test"; patientId?: string; testId: string; status?: PatientState["tests"][string] }
  | { type: "all"; conditions: Condition[] }
  | { type: "any"; conditions: Condition[] }
  | { type: "flagCount"; keys: string[]; operator?: ComparisonOperator; value: number }
  | { type: "value"; key: string; value: string | number | boolean; operator?: ComparisonOperator };

export type ComparisonOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export type Effect =
  | { type: "flag"; key: string; value: boolean }
  | { type: "increment"; ability: AbilityName; amount: number }
  | { type: "trust"; patientId: string; amount: number }
  | { type: "time"; amount: number }
  | { type: "setTime"; value: number }
  | { type: "advanceToTime"; value: number }
  | { type: "clue"; patientId: string; clueId: string; remove?: boolean }
  | { type: "diagnosis"; patientId: string; diagnosisId: string; remove?: boolean }
  | { type: "primaryDiagnosis"; diagnosisId: string }
  | { type: "test"; patientId: string; testId: string; status: PatientState["tests"][string] }
  | { type: "disease"; patientId: string; stage: DiseaseStage }
  | { type: "resonance"; ability: AbilityName; amount: number }
  | { type: "value"; key: string; value: string | number | boolean }
  | { type: "valueIncrement"; key: string; amount: number }
  | { type: "timeline"; entry: TimelineEffectEntry }
  | { type: "conditional"; conditions: Condition[]; effects: Effect[] };

export interface ActiveCheck {
  id: string;
  ability: AbilityName;
  dc: number;
  modifiers?: number;
}

interface ChoiceBase {
  id: string;
  label: string;
  ariaLabel?: string;
  conditions?: Condition[];
  effects?: Effect[];
  timeCost?: number;
}

export type Choice = ChoiceBase & (
  | { check?: never; next: string }
  | { check?: never; next?: never; terminal: true }
  | { check: ActiveCheck; next: { success: string; failure: string } }
);

export type NarrativeBlock =
  | { type: "prose"; text: string; conditions?: Condition[] }
  | { type: "dialogue"; speaker: string; text: string; conditions?: Condition[] }
  | { type: "thought"; text: string; conditions?: Condition[]; ability?: AbilityName; label?: string }
  | { type: "system"; text: string; conditions?: Condition[] };

export interface ScenePresentation {
  mode?: "default" | "immersive" | "cinematic";
  hideTime?: boolean;
  hideCase?: boolean;
  hideVitals?: boolean;
  imageKey?: string;
  timeLabel?: string;
  location?: string;
  autoAdvanceMs?: number;
  clinicalData?: ClinicalDatum[];
}

export type DiagnosisOutcome = "failed" | "late" | "appropriate";
export type TreatmentOutcome = "delayed" | "appropriate";
export type TriggerOutcome = "unknown" | "partial" | "sufficient";
export type RelationshipOutcome = "broken" | "guarded" | "trusted";
export interface EndingContext { diagnosis: DiagnosisOutcome; treatment: TreatmentOutcome; trigger: TriggerOutcome; relationship: RelationshipOutcome }
export interface EndingRule { id: string; when: Partial<EndingContext> & { triggerInsufficient?: boolean; severeDelay?: boolean } }
export interface CaseMemory { id: string; title: string; description: string; sourceChapter: string }
export interface CaseArchive {
  caseId: string; title: string; finalDiagnosis: string; biochemicalDiagnosis: string; subtypeConfirmation: string;
  diagnosis: DiagnosisOutcome; treatment: TreatmentOutcome; trigger: TriggerOutcome; relationship: RelationshipOutcome;
  triggersDiscovered: string[]; complications: string[]; outcome: string; followUp: string; endingId: string;
}
export interface ArchiveDefinition { caseId: string; title: string; finalDiagnosis: string; biochemicalDiagnosis: string; subtypeConfirmation: string; complications: string[] }
export interface PersistentProfile { completedCases: string[]; caseMemories: CaseMemory[]; archives: CaseArchive[]; firstEndingCompleted: boolean }

export interface StoryNode {
  id: string;
  title?: string;
  conditions?: Condition[];
  blocks: NarrativeBlock[];
  choices?: Choice[];
  onEnter?: Effect[];
  onExit?: Effect[];
  autoNext?: string;
  presentation?: ScenePresentation;
}

export interface ChapterDefinition {
  id: string;
  title: string;
  startNodeId: string;
  nodes: Record<string, StoryNode>;
  initial?: {
    time?: number;
    patients?: Record<string, PatientState>;
    flags?: Record<string, boolean>;
  };
  completion?: { caseId: string; memory: CaseMemory; archive: ArchiveDefinition };
  clueDefinitions?: Record<string, ClueDefinition>;
  diagnosisDefinitions?: Record<string, DiagnosisDefinition>;
  testDefinitions?: Record<string, TestDefinition>;
}

export interface GameState {
  runId: string;
  chapterId: string;
  currentNodeId: string;
  player: PlayerState;
  patients: Record<string, PatientState>;
  flags: Record<string, boolean>;
  values: Record<string, string | number | boolean>;
  time: number;
  resonance: Record<AbilityName, number>;
  rngState: number;
  checkResults: Record<string, CheckResult>;
  visitedNodeIds: string[];
  diagnosisState?: Record<string, DiagnosisState>;
  timeline?: TimelineEntry[];
  nodeEnteredAt: number;
  updatedAt: number;
}

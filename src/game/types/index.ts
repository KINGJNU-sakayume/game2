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

/** People who speak in a chapter. The key is the speaker name used in dialogue blocks. */
export interface CharacterDefinition {
  name: string;
  role?: string;
  /** Visual accent for the speaker tag. Kept to a small authored palette. */
  tone?: "ink" | "rose" | "teal" | "amber" | "slate" | "moss" | "clay";
  /** The player character; rendered as the first-person voice. */
  isPlayer?: boolean;
}

/**
 * Art-directed stage backgrounds used when a scene has no photograph, or while
 * a photograph is still missing from the asset pipeline.
 */
export type BackdropKey =
  | "black" | "paper" | "dawn" | "board" | "phone"
  | "er" | "er-night" | "ward" | "icu" | "hallway"
  | "home-night" | "semibasement" | "rain" | "village" | "field";

export type VisualAssetKind = "cinematic" | "scene" | "evidence";
export type VisualAspectRatio = "9:16" | "16:9" | "4:3" | "1:1";
export interface EvidenceOverlay {
  lines?: string[];
  fields?: { label?: string; value: string }[];
}
export interface VisualAssetDefinition {
  id: string;
  kind: VisualAssetKind;
  src: string;
  aspectRatio: VisualAspectRatio;
  alt: string;
  focalPoint?: { x: number; y: number };
  continuityGroup?: string;
  referenceOnly?: boolean;
  overlay?: EvidenceOverlay;
  /** "missing" keeps a canonical slot in the manifest while the file is re-imported. */
  status?: "ready" | "missing";
  /** What the stage shows while the asset is missing. */
  fallback?: { assetId?: string; backdrop?: BackdropKey; focalPoint?: { x: number; y: number } };
}

export interface SceneHotspot {
  id: string;
  label: string;
  /** Percentage coordinates relative to the displayed scene image. */
  x: number;
  y: number;
  /** Optional percentage dimensions; the rendered target is always at least 44 CSS px. */
  width?: number;
  height?: number;
  /** A shortcut to a choice on the same node, never an independent transition. */
  choiceId: string;
  icon?: "inspect" | "object" | "person" | "environment";
}

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
  | { type: "not"; condition: Condition }
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

/** Actions leave the story graph: they are handled by the app shell, never by the resolver. */
export type ChoiceAction = "restart" | "title" | "nextChapter";

interface ChoiceBase {
  id: string;
  label: string;
  ariaLabel?: string;
  conditions?: Condition[];
  effects?: Effect[];
  timeCost?: number;
}

export type Choice = ChoiceBase & (
  | { check?: never; next: string; action?: never }
  | { check?: never; next?: never; terminal: true; action?: never }
  | { check?: never; next?: never; action: ChoiceAction }
  | { check: ActiveCheck; next: { success: string; failure: string }; action?: never }
);

export type NarrativeBlock =
  | { type: "prose"; text: string; conditions?: Condition[] }
  | { type: "dialogue"; speaker: string; text: string; conditions?: Condition[] }
  | { type: "thought"; text: string; conditions?: Condition[]; ability?: AbilityName; label?: string }
  | { type: "system"; text: string; conditions?: Condition[]; variant?: "readout" | "stamp" | "note" };

export type TitleStyle = "chapter" | "phase" | "place" | "ending" | "heading";

export interface ScenePresentation {
  /**
   * default: scene art with the dialogue box.
   * immersive: darkness and centred text (prologue, disclosures).
   * cinematic: full-frame art, text kept low.
   * conference: the case board — findings are pinned before the voices speak.
   */
  mode?: "default" | "immersive" | "cinematic" | "conference";
  hideTime?: boolean;
  hideCase?: boolean;
  hideVitals?: boolean;
  /** Canonical registry ID. imageKey was prototype-only and is intentionally not persisted. */
  assetId?: string;
  /** Stage background when no asset is set. Nodes without either inherit the previous scene. */
  backdrop?: BackdropKey;
  timeLabel?: string;
  location?: string;
  autoAdvanceMs?: number;
  clinicalData?: ClinicalDatum[];
  hotspots?: SceneHotspot[];
  /** How the node title is staged. Defaults to a heading above the choices. */
  titleStyle?: TitleStyle;
  /** Small secondary line on staged titles, e.g. an English caption on a phase card. */
  titleCaption?: string;
  /** A short line shown above the choices when the node has no text of its own. */
  prompt?: string;
  /** Special end-of-case screens. */
  screen?: "archive" | "reflection" | "complete";
}

export type DiagnosisOutcome = "failed" | "late" | "appropriate";
export type TreatmentOutcome = "delayed" | "appropriate";
export type TriggerOutcome = "unknown" | "partial" | "sufficient";
export type RelationshipOutcome = "broken" | "guarded" | "trusted";
export type EndingId = "END_A" | "END_B" | "END_C" | "END_D" | "END_E";
export interface EndingContext { diagnosis: DiagnosisOutcome; treatment: TreatmentOutcome; trigger: TriggerOutcome; relationship: RelationshipOutcome }
export interface EndingRule { id: string; when: Partial<EndingContext> & { triggerInsufficient?: boolean; severeDelay?: boolean } }

/** Chapter-specific inputs for the generic outcome axes. The engine never reads chapter flags directly. */
export interface OutcomeRules {
  /** The person whose trust decides the relationship axis. */
  patientId: string;
  /** Every flag known → sufficient, some → partial, none → unknown. */
  triggers: { flag: string; label: string }[];
  relationship: { brokenBelow: number; trustedAt: number; boundaryFlag?: string; repairFlag?: string };
  severeDelayFlag?: string;
  /** When set during play, the archive records that follow-up moved to another team. */
  transferFlag?: string;
  outcomeText: Record<EndingId, string>;
  followUpText: Record<RelationshipOutcome, string>;
}

export interface CaseMemory { id: string; title: string; description: string; sourceChapter: string }
export interface CaseArchive {
  caseId: string; title: string; finalDiagnosis: string; biochemicalDiagnosis: string; subtypeConfirmation: string;
  diagnosis: DiagnosisOutcome; treatment: TreatmentOutcome; trigger: TriggerOutcome; relationship: RelationshipOutcome;
  triggersDiscovered: string[]; complications: string[]; outcome: string; followUp: string; endingId: string;
  /** The first hypothesis the player committed to, when the chapter records one. */
  firstHypothesis?: string;
  endingTitle?: string;
  chapterId?: string;
}
export interface ArchiveDefinition {
  caseId: string; title: string; finalDiagnosis: string; biochemicalDiagnosis: string; subtypeConfirmation: string; complications: string[];
  /** Field labels for chapters whose confirmation is not biochemical/genetic. */
  labels?: { biochemicalDiagnosis?: string; subtypeConfirmation?: string };
  /** Maps a value key to readable first-hypothesis labels. */
  firstHypothesis?: { valueKey: string; labels: Record<string, string> };
}
export interface PersistentProfile {
  completedCases: string[];
  caseMemories: CaseMemory[];
  archives: CaseArchive[];
  firstEndingCompleted: boolean;
  /** Abilities carried between chapters. Absent until the first case is completed. */
  player?: PlayerState;
}

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
  /** 1-based order used for the chapter card. */
  number?: number;
  title: string;
  /** The chapter name without the numbering, used on cards. */
  subtitle?: string;
  synopsis?: string;
  cover?: { assetId?: string; backdrop?: BackdropKey };
  startNodeId: string;
  nodes: Record<string, StoryNode>;
  visualAssets?: Record<string, VisualAssetDefinition>;
  characters?: Record<string, CharacterDefinition>;
  initial?: {
    time?: number;
    patients?: Record<string, PatientState>;
    flags?: Record<string, boolean>;
  };
  outcomes?: OutcomeRules;
  completion?: { caseId: string; memory: CaseMemory; archive: ArchiveDefinition; nodeId?: string };
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

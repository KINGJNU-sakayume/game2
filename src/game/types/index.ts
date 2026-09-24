export type AbilityName = "observation" | "empathy" | "reasoning" | "resolve";
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
  | { type: "test"; patientId?: string; testId: string; status?: PatientState["tests"][string] };

export type ComparisonOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export type Effect =
  | { type: "flag"; key: string; value: boolean }
  | { type: "increment"; ability: AbilityName; amount: number }
  | { type: "trust"; patientId: string; amount: number }
  | { type: "time"; amount: number }
  | { type: "clue"; patientId: string; clueId: string; remove?: boolean }
  | { type: "diagnosis"; patientId: string; diagnosisId: string; remove?: boolean }
  | { type: "test"; patientId: string; testId: string; status: PatientState["tests"][string] }
  | { type: "disease"; patientId: string; stage: DiseaseStage }
  | { type: "resonance"; amount: number };

export interface ActiveCheck {
  id: string;
  ability: AbilityName;
  dc: number;
  modifiers?: number;
}

export interface Choice {
  id: string;
  label: string;
  ariaLabel?: string;
  conditions?: Condition[];
  effects?: Effect[];
  timeCost?: number;
  check?: ActiveCheck;
  next: string | { success: string; failure: string };
}

export type NarrativeBlock =
  | { type: "prose"; text: string }
  | { type: "dialogue"; speaker: string; text: string }
  | { type: "thought"; text: string }
  | { type: "system"; text: string };

export interface StoryNode {
  id: string;
  title?: string;
  conditions?: Condition[];
  blocks: NarrativeBlock[];
  choices?: Choice[];
  onEnter?: Effect[];
  onExit?: Effect[];
  autoNext?: string;
}

export interface ChapterDefinition {
  id: string;
  title: string;
  startNodeId: string;
  nodes: Record<string, StoryNode>;
}

export interface GameState {
  runId: string;
  chapterId: string;
  currentNodeId: string;
  player: PlayerState;
  patients: Record<string, PatientState>;
  flags: Record<string, boolean>;
  time: number;
  resonance: number;
  rngState: number;
  checkResults: Record<string, CheckResult>;
  visitedNodeIds: string[];
  nodeEnteredAt: number;
  updatedAt: number;
}

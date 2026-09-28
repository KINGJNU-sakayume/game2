import type { ChapterDefinition, GameState, PersistentProfile, PlayerState } from "@/game/types";
import { zeroResonance } from "@/game/abilities";
import { enterNode } from "./nodeResolver";

/** Flag set on every new run for each Case Memory the profile has unlocked. */
export const memoryFlag = (memoryId: string) => `memory_${memoryId}`;

export interface CreateRunOptions {
  seed?: number;
  timestamp?: number;
  runId?: string;
  memories?: PersistentProfile["caseMemories"];
}

/**
 * Builds a fresh run. Chapter initial data is always cloned so a run can never
 * write through to the chapter definition that other runs (or tests) share.
 */
export function createRun(chapter: ChapterDefinition, player: PlayerState, options: CreateRunOptions = {}): GameState {
  const timestamp = options.timestamp ?? Date.now();
  const memoryFlags = Object.fromEntries((options.memories ?? []).map((memory) => [memoryFlag(memory.id), true]));
  const base: GameState = {
    runId: options.runId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `run-${timestamp}`),
    chapterId: chapter.id,
    currentNodeId: chapter.startNodeId,
    player: structuredClone(player),
    patients: structuredClone(chapter.initial?.patients ?? {}),
    flags: { ...(chapter.initial?.flags ?? {}), ...memoryFlags },
    values: {},
    time: chapter.initial?.time ?? 0,
    resonance: zeroResonance(),
    rngState: (options.seed ?? timestamp) >>> 0,
    checkResults: {},
    visitedNodeIds: [],
    diagnosisState: {},
    timeline: [],
    nodeEnteredAt: timestamp,
    updatedAt: timestamp,
  };
  return enterNode(base, chapter, chapter.startNodeId, timestamp);
}

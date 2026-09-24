"use client";

import { create } from "zustand";
import { enterNode, executeChoice } from "@/game/engine/nodeResolver";
import type { ChapterDefinition, GameState, PersistentProfile, PlayerState } from "@/game/types";
import { clearActiveRun, completeCase, emptyProfile, loadActiveRun, loadProfile, saveActiveRun, saveProfile } from "./saveStore";
import { zeroResonance } from "@/game/abilities";
import { createArchive } from "@/game/engine/endingResolver";
import { moveDiagnosis, setPrimaryDiagnosis, toggleLinkedClue } from "./caseState";

interface GameStore {
  activeRun: GameState | null;
  profile: PersistentProfile;
  hydrated: boolean;
  inputLocked: boolean;
  persistenceStatus: "healthy" | "saving" | "degraded";
  initialize: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => void;
  hydrate: () => Promise<void>;
  enter: (chapter: ChapterDefinition, nodeId: string) => void;
  choose: (chapter: ChapterDefinition, choiceId: string) => Promise<void>;
  restore: (state: GameState) => void;
  restart: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => Promise<void>;
  setPrimaryDiagnosis: (id: string) => void;
  moveDiagnosis: (id: string, direction: -1 | 1) => void;
  toggleLinkedClue: (diagnosisId: string, clueId: string) => void;
}

let hydrationPromise: Promise<void> | undefined;

export const useGameStore = create<GameStore>((set, get) => ({
  activeRun: null,
  profile: emptyProfile(),
  hydrated: false,
  inputLocked: false,
  persistenceStatus: "healthy",
  initialize: (chapter, player, seed = Date.now()) => {
    if (!get().hydrated) return;
    const timestamp = Date.now();
    const base: GameState = {
      runId: crypto.randomUUID(), chapterId: chapter.id, currentNodeId: chapter.startNodeId,
      player,
      patients: chapter.initial?.patients ?? {},
      flags: chapter.initial?.flags ?? {},
      values: {},
      time: chapter.initial?.time ?? 0,
      resonance: zeroResonance(), rngState: seed >>> 0,
      checkResults: {}, visitedNodeIds: [], diagnosisState: {}, timeline: [], nodeEnteredAt: timestamp, updatedAt: timestamp,
    };
    set({ activeRun: enterNode(base, chapter, chapter.startNodeId, timestamp) });
  },
  hydrate: async () => {
    hydrationPromise ??= Promise.all([loadActiveRun(), loadProfile()])
      .then(([saved, profile]) => set((current) => ({ activeRun: saved ?? current.activeRun, profile })))
      .catch(() => undefined)
      .finally(() => set({ hydrated: true }));
    await hydrationPromise;
  },
  enter: (chapter, nodeId) => {
    const state = get().activeRun;
    if (state) set({ activeRun: enterNode(state, chapter, nodeId, Date.now()) });
  },
  choose: async (chapter, choiceId) => {
    const current = get();
    if (!current.activeRun || current.inputLocked) return;
    set({ inputLocked: true, persistenceStatus: "saving" });
    try {
      const completed = executeChoice(current.activeRun, chapter, choiceId, Date.now());
      set({ activeRun: completed });

      let persistenceFailed = false;
      try {
        await saveActiveRun(completed);
      } catch {
        persistenceFailed = true;
      }

      let profile = get().profile;
      let shouldPersistProfile = current.persistenceStatus === "degraded";
      if (completed.currentNodeId === "CASE_COMPLETE" && chapter.completion) {
        profile = completeCase(profile, chapter.completion.caseId, chapter.completion.memory, createArchive(completed, chapter.completion.archive));
        set({ profile });
        shouldPersistProfile = true;
      }

      if (shouldPersistProfile) {
        try {
          await saveProfile(profile);
        } catch {
          persistenceFailed = true;
        }
      }

      set({ persistenceStatus: persistenceFailed ? "degraded" : "healthy" });
    } catch (error) {
      set({ persistenceStatus: current.persistenceStatus });
      throw error;
    } finally {
      set({ inputLocked: false });
    }
  },
  restore: (state) => set({ activeRun: state }),
  restart: async (chapter, player, seed = Date.now()) => {
    await clearActiveRun().catch(() => undefined);
    const timestamp = Date.now();
    const base: GameState = { runId: crypto.randomUUID(), chapterId: chapter.id, currentNodeId: chapter.startNodeId, player, patients: structuredClone(chapter.initial?.patients ?? {}), flags: { ...(chapter.initial?.flags ?? {}) }, values: {}, time: chapter.initial?.time ?? 0, resonance: zeroResonance(), rngState: seed >>> 0, checkResults: {}, visitedNodeIds: [], diagnosisState: {}, timeline: [], nodeEnteredAt: timestamp, updatedAt: timestamp };
    const activeRun = enterNode(base, chapter, chapter.startNodeId, timestamp);
    set({ activeRun });

    const results = await Promise.allSettled([saveActiveRun(activeRun), saveProfile(get().profile)]);
    set({ persistenceStatus: results.some(({ status }) => status === "rejected") ? "degraded" : "healthy" });
  },
  setPrimaryDiagnosis: (id) => { set(({ activeRun }) => activeRun ? { activeRun: { ...activeRun, diagnosisState: setPrimaryDiagnosis(activeRun.diagnosisState ?? {}, id) } } : {}); const state=get().activeRun;if(state)void saveActiveRun(state).catch(()=>set({persistenceStatus:"degraded"})); },
  moveDiagnosis: (id, direction) => { set(({ activeRun }) => {
    if (!activeRun) return {};
    return { activeRun: { ...activeRun, diagnosisState: moveDiagnosis(activeRun.diagnosisState ?? {},id,direction) } };
  }); const moved=get().activeRun;if(moved)void saveActiveRun(moved).catch(()=>set({persistenceStatus:"degraded"})); },
  toggleLinkedClue: (diagnosisId, clueId) => { set(({ activeRun }) => {
    if (!activeRun?.diagnosisState?.[diagnosisId]) return {};
    return { activeRun: { ...activeRun, diagnosisState: toggleLinkedClue(activeRun.diagnosisState,diagnosisId,clueId) } };
  }); const linked=get().activeRun;if(linked)void saveActiveRun(linked).catch(()=>set({persistenceStatus:"degraded"})); },
}));

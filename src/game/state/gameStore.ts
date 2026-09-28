"use client";

import { create } from "zustand";
import { advanceTimedNode, executeChoice } from "@/game/engine/nodeResolver";
import { createRun } from "@/game/engine/runFactory";
import { createCaseArchive } from "@/game/engine/endingResolver";
import { growFromRun } from "@/game/engine/progression";
import type { AbilityName, ChapterDefinition, GameState, PersistentProfile, PlayerState } from "@/game/types";
import { clearActiveRun, completeCase, emptyProfile, loadActiveRun, loadProfile, saveActiveRun, saveProfile } from "./saveStore";
import { moveDiagnosis, setPrimaryDiagnosis, toggleLinkedClue } from "./caseState";

export type Screen = "title" | "play";
type PersistenceStatus = "healthy" | "saving" | "degraded";

interface GameStore {
  activeRun: GameState | null;
  profile: PersistentProfile;
  hydrated: boolean;
  inputLocked: boolean;
  persistenceStatus: PersistenceStatus;
  screen: Screen;
  /** The ability that grew when the current chapter was first completed. */
  lastGrowth?: { chapterId: string; ability: AbilityName };
  hydrate: () => Promise<void>;
  startChapter: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => Promise<void>;
  resume: () => void;
  goToTitle: () => void;
  choose: (chapter: ChapterDefinition, choiceId: string) => Promise<void>;
  advance: (chapter: ChapterDefinition) => Promise<void>;
  restore: (state: GameState) => void;
  restart: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => Promise<void>;
  setPrimaryDiagnosis: (id: string) => void;
  moveDiagnosis: (id: string, direction: -1 | 1) => void;
  toggleLinkedClue: (diagnosisId: string, clueId: string) => void;
}

let hydrationPromise: Promise<void> | undefined;

export const useGameStore = create<GameStore>((set, get) => {
  /** Saves in the background; the game never waits on storage to keep playing. */
  const persistRun = (state: GameState) => void saveActiveRun(state).catch(() => set({ persistenceStatus: "degraded" }));
  const updateCase = (update: (run: GameState) => GameState) => {
    const run = get().activeRun;
    if (!run) return;
    const next = update(run);
    if (next === run) return;
    set({ activeRun: next });
    persistRun(next);
  };

  const beginRun = async (chapter: ChapterDefinition, player: PlayerState, seed?: number) => {
    await clearActiveRun().catch(() => undefined);
    const activeRun = createRun(chapter, player, { seed, memories: get().profile.caseMemories });
    set({ activeRun, screen: "play", lastGrowth: undefined, inputLocked: false });
    const results = await Promise.allSettled([saveActiveRun(activeRun), saveProfile(get().profile)]);
    set({ persistenceStatus: results.some(({ status }) => status === "rejected") ? "degraded" : "healthy" });
  };

  return {
    activeRun: null,
    profile: emptyProfile(),
    hydrated: false,
    inputLocked: false,
    persistenceStatus: "healthy",
    screen: "title",
    hydrate: async () => {
      hydrationPromise ??= Promise.all([loadActiveRun(), loadProfile()])
        .then(([saved, profile]) => set((current) => ({ activeRun: saved ?? current.activeRun, profile })))
        .catch(() => undefined)
        .finally(() => set({ hydrated: true }));
      await hydrationPromise;
    },
    startChapter: beginRun,
    restart: beginRun,
    resume: () => { if (get().activeRun) set({ screen: "play" }); },
    goToTitle: () => set({ screen: "title" }),
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
        const completionNode = chapter.completion?.nodeId ?? "CASE_COMPLETE";
        if (completed.currentNodeId === completionNode && chapter.completion) {
          const firstCompletion = !profile.completedCases.includes(chapter.completion.caseId);
          profile = completeCase(profile, chapter.completion.caseId, chapter.completion.memory, createCaseArchive(completed, chapter));
          if (firstCompletion) {
            const growth = growFromRun(completed.player, completed.resonance);
            profile = { ...profile, player: growth.player };
            set({ lastGrowth: growth.grown ? { chapterId: chapter.id, ability: growth.grown } : undefined });
          }
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
    advance: async (chapter) => {
      const run = get().activeRun;
      if (!run) return;
      const next = advanceTimedNode(run, chapter, Date.now());
      if (next === run) return;
      set({ activeRun: next });
      try {
        await saveActiveRun(next);
      } catch {
        set({ persistenceStatus: "degraded" });
      }
    },
    restore: (state) => set({ activeRun: state }),
    setPrimaryDiagnosis: (id) => updateCase((run) => ({ ...run, diagnosisState: setPrimaryDiagnosis(run.diagnosisState ?? {}, id) })),
    moveDiagnosis: (id, direction) => updateCase((run) => ({ ...run, diagnosisState: moveDiagnosis(run.diagnosisState ?? {}, id, direction) })),
    toggleLinkedClue: (diagnosisId, clueId) => updateCase((run) => run.diagnosisState?.[diagnosisId]
      ? { ...run, diagnosisState: toggleLinkedClue(run.diagnosisState, diagnosisId, clueId) }
      : run),
  };
});

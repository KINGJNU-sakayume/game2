"use client";

import { create } from "zustand";
import { enterNode, executeChoice } from "@/game/engine/nodeResolver";
import type { ChapterDefinition, GameState, PlayerState } from "@/game/types";
import { loadActiveRun, saveActiveRun } from "./saveStore";
import { zeroResonance } from "@/game/abilities";

interface GameStore {
  activeRun: GameState | null;
  hydrated: boolean;
  inputLocked: boolean;
  persistenceStatus: "healthy" | "saving" | "degraded";
  initialize: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => void;
  hydrate: () => Promise<void>;
  enter: (chapter: ChapterDefinition, nodeId: string) => void;
  choose: (chapter: ChapterDefinition, choiceId: string) => Promise<void>;
  restore: (state: GameState) => void;
}

let hydrationPromise: Promise<void> | undefined;

export const useGameStore = create<GameStore>((set, get) => ({
  activeRun: null,
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
      checkResults: {}, visitedNodeIds: [], nodeEnteredAt: timestamp, updatedAt: timestamp,
    };
    set({ activeRun: enterNode(base, chapter, chapter.startNodeId, timestamp) });
  },
  hydrate: async () => {
    hydrationPromise ??= loadActiveRun()
      .then((saved) => set((current) => ({ activeRun: saved ?? current.activeRun })))
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
      try {
        await saveActiveRun(completed);
        set({ persistenceStatus: "healthy" });
      } catch {
        set({ persistenceStatus: "degraded" });
      }
    } catch (error) {
      set({ persistenceStatus: current.persistenceStatus });
      throw error;
    } finally {
      set({ inputLocked: false });
    }
  },
  restore: (state) => set({ activeRun: state }),
}));

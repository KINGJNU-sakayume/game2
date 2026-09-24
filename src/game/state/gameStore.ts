"use client";

import { create } from "zustand";
import { enterNode, executeChoice } from "@/game/engine/nodeResolver";
import type { ChapterDefinition, GameState, PlayerState } from "@/game/types";
import { loadActiveRun, saveActiveRun } from "./saveStore";

interface GameStore {
  activeRun: GameState | null;
  hydrated: boolean;
  inputLocked: boolean;
  initialize: (chapter: ChapterDefinition, player: PlayerState, seed?: number) => void;
  hydrate: () => Promise<void>;
  enter: (chapter: ChapterDefinition, nodeId: string) => void;
  choose: (chapter: ChapterDefinition, choiceId: string) => Promise<void>;
  restore: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  activeRun: null,
  hydrated: false,
  inputLocked: false,
  initialize: (chapter, player, seed = Date.now()) => {
    if (!get().hydrated) return;
    const timestamp = Date.now();
    const base: GameState = {
      runId: crypto.randomUUID(), chapterId: chapter.id, currentNodeId: chapter.startNodeId,
      player, patients: {}, flags: {}, time: 0, resonance: 0, rngState: seed >>> 0,
      checkResults: {}, visitedNodeIds: [], nodeEnteredAt: timestamp, updatedAt: timestamp,
    };
    set({ activeRun: enterNode(base, chapter, chapter.startNodeId, timestamp) });
  },
  hydrate: async () => {
    const saved = await loadActiveRun();
    set((current) => ({ activeRun: saved ?? current.activeRun, hydrated: true }));
  },
  enter: (chapter, nodeId) => {
    const state = get().activeRun;
    if (state) set({ activeRun: enterNode(state, chapter, nodeId, Date.now()) });
  },
  choose: async (chapter, choiceId) => {
    const current = get();
    if (!current.activeRun || current.inputLocked) return;
    set({ inputLocked: true });
    try {
      const completed = executeChoice(current.activeRun, chapter, choiceId, Date.now());
      set({ activeRun: completed });
      await saveActiveRun(completed);
    } finally {
      set({ inputLocked: false });
    }
  },
  restore: (state) => set({ activeRun: state }),
}));

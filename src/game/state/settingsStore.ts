"use client";

import { create } from "zustand";

export type TextSpeed = "slow" | "normal" | "fast" | "instant";

export interface Settings {
  textSpeed: TextSpeed;
  autoAdvance: boolean;
}

interface SettingsStore extends Settings {
  loaded: boolean;
  load: () => void;
  update: (patch: Partial<Settings>) => void;
}

const STORAGE_KEY = "after-the-rain:settings";
const defaults: Settings = { textSpeed: "normal", autoAdvance: false };

/** Characters per second for the typewriter. `instant` skips typing entirely. */
export const TEXT_SPEED_CPS: Record<TextSpeed, number> = { slow: 26, normal: 44, fast: 90, instant: Infinity };
export const TEXT_SPEED_LABEL: Record<TextSpeed, string> = { slow: "느리게", normal: "보통", fast: "빠르게", instant: "즉시" };

function read(): Partial<Settings> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<Settings> : {};
  } catch {
    return {};
  }
}

/** Per-device reading preferences. Storage failures fall back to defaults silently. */
export const useSettings = create<SettingsStore>((set, get) => ({
  ...defaults,
  loaded: false,
  load: () => {
    if (get().loaded || typeof window === "undefined") return;
    const saved = read();
    set({
      loaded: true,
      textSpeed: saved.textSpeed && saved.textSpeed in TEXT_SPEED_CPS ? saved.textSpeed : defaults.textSpeed,
      autoAdvance: typeof saved.autoAdvance === "boolean" ? saved.autoAdvance : defaults.autoAdvance,
    });
  },
  update: (patch) => {
    set(patch);
    const { textSpeed, autoAdvance } = get();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ textSpeed, autoAdvance }));
    } catch {
      // Private windows and blocked storage keep the in-memory preference.
    }
  },
}));

import Dexie, { type EntityTable } from "dexie";
import type { GameState } from "@/game/types";

interface SavedRun { id: "active"; state: GameState; savedAt: number }

class GameDatabase extends Dexie {
  runs!: EntityTable<SavedRun, "id">;
  constructor() {
    super("after-the-rain");
    this.version(1).stores({ runs: "id, savedAt" });
  }
}

let database: GameDatabase | undefined;
function getDatabase(): GameDatabase | undefined {
  if (typeof window === "undefined" || !("indexedDB" in window)) return undefined;
  return database ??= new GameDatabase();
}

export async function saveActiveRun(state: GameState): Promise<void> {
  await getDatabase()?.runs.put({ id: "active", state, savedAt: Date.now() });
}

export async function loadActiveRun(): Promise<GameState | undefined> {
  return (await getDatabase()?.runs.get("active"))?.state;
}

export async function clearActiveRun(): Promise<void> {
  await getDatabase()?.runs.delete("active");
}

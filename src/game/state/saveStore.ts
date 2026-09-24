import Dexie, { type EntityTable } from "dexie";
import type { GameState } from "@/game/types";
import { ABILITY_NAMES } from "@/game/types";
import { zeroResonance } from "@/game/abilities";

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
  const saved = (await getDatabase()?.runs.get("active"))?.state;
  if (!saved) return undefined;
  const legacy = saved as GameState & { resonance: GameState["resonance"] | number };
  const abilities = Object.fromEntries(ABILITY_NAMES.map((name) => [name, saved.player.abilities[name] ?? (name === "decision" ? (saved.player.abilities as Record<string, number>).resolve : undefined) ?? 2]));
  return {
    ...saved,
    player: { ...saved.player, abilities: abilities as GameState["player"]["abilities"] },
    values: saved.values ?? {},
    resonance: typeof legacy.resonance === "number" ? zeroResonance() : { ...zeroResonance(), ...legacy.resonance },
  };
}

export async function clearActiveRun(): Promise<void> {
  await getDatabase()?.runs.delete("active");
}

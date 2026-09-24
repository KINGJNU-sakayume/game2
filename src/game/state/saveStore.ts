import Dexie, { type EntityTable } from "dexie";
import type { GameState, PersistentProfile } from "@/game/types";
import { ABILITY_NAMES } from "@/game/types";
import { zeroResonance } from "@/game/abilities";

interface SavedRun { id: "active"; state: GameState; savedAt: number }
interface SavedProfile { id: "profile"; profile: PersistentProfile; savedAt: number }
export const emptyProfile = (): PersistentProfile => ({ completedCases: [], caseMemories: [], archives: [], firstEndingCompleted: false });

class GameDatabase extends Dexie {
  runs!: EntityTable<SavedRun, "id">;
  profiles!: EntityTable<SavedProfile, "id">;
  constructor() {
    super("after-the-rain");
    this.version(1).stores({ runs: "id, savedAt" });
    this.version(2).stores({ runs: "id, savedAt", profiles: "id, savedAt" });
  }
}

export async function loadProfile(): Promise<PersistentProfile> {
  const saved = (await getDatabase()?.profiles.get("profile"))?.profile;
  return saved ? { ...emptyProfile(), ...saved, completedCases: saved.completedCases ?? [], caseMemories: saved.caseMemories ?? [], archives: saved.archives ?? [] } : emptyProfile();
}

export async function saveProfile(profile: PersistentProfile): Promise<void> {
  await getDatabase()?.profiles.put({ id: "profile", profile, savedAt: Date.now() });
}

export function completeCase(profile: PersistentProfile, caseId: string, memory: PersistentProfile["caseMemories"][number], archive: PersistentProfile["archives"][number]): PersistentProfile {
  return { completedCases: [...new Set([...profile.completedCases, caseId])], caseMemories: profile.caseMemories.some(({ id }) => id === memory.id) ? profile.caseMemories : [...profile.caseMemories, memory], archives: [...profile.archives.filter(({ caseId: id }) => id !== archive.caseId), archive], firstEndingCompleted: true };
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

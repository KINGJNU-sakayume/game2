import { ABILITY_NAMES, type AbilityName, type GameState, type PlayerState } from "@/game/types";

export const ABILITY_CAP = 5;

/**
 * Between chapters the ability the player leaned on most grows by one. Ties
 * resolve in the fixed ability order so the result is deterministic.
 */
export function growFromRun(player: PlayerState, resonance: GameState["resonance"]): { player: PlayerState; grown?: AbilityName } {
  let best: AbilityName | undefined;
  for (const ability of ABILITY_NAMES) {
    if (resonance[ability] <= 0 || player.abilities[ability] >= ABILITY_CAP) continue;
    if (!best || resonance[ability] > resonance[best]) best = ability;
  }
  if (!best) return { player };
  return { player: { ...player, abilities: { ...player.abilities, [best]: player.abilities[best] + 1 } }, grown: best };
}

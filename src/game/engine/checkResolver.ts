import type { ActiveCheck, CheckResult, GameState } from "@/game/types";
import { rollDie } from "./rng";

export interface CheckResolution { result: CheckResult; rngState: number; cached: boolean }

export function resolveCheck(check: ActiveCheck, state: GameState, timestamp: number): CheckResolution {
  const cached = state.checkResults[check.id];
  if (cached) return { result: cached, rngState: state.rngState, cached: true };
  const first = rollDie(state.rngState, 6);
  const second = rollDie(first.state, 6);
  const abilityModifier = state.player.abilities[check.ability];
  const modifiers = check.modifiers ?? 0;
  const total = first.roll + second.roll + abilityModifier + modifiers;
  return {
    result: { checkId: check.id, rolls: [first.roll, second.roll], ability: check.ability, abilityModifier, modifiers, total, dc: check.dc, success: total >= check.dc, timestamp },
    rngState: second.state,
    cached: false,
  };
}

import type { Choice, ComparisonOperator, Condition, Effect } from "@/game/types";
import { clueOf, trust, trustIs } from "../shared/helpers";

export * from "../shared/helpers";
/** Backwards-compatible alias used by older chapter files. */
export { atLeast as ability } from "../shared/helpers";

export const HARIN = "harin";
export const clue = (clueId: string): Effect => clueOf(HARIN, clueId);
export const harinTrust = (amount: number): Effect => trust(HARIN, amount);
export const trusts = (operator: ComparisonOperator, value: number): Condition => trustIs(HARIN, operator, value);
export const returnTo = (id: string, label: string, next: string): Choice[] => [{ id, label, next }];

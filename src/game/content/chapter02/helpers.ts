import type { ComparisonOperator, Condition, Effect } from "@/game/types";
import { clueOf, trust, trustIs } from "../shared/helpers";

export * from "../shared/helpers";

/** 박시우 (9): the child brought in first. */
export const SIWOO = "siwoo";
/** 정혜진 (41): his mother — guardian, second patient, and the relationship axis. */
export const HYEJIN = "hyejin";

export const clue = (clueId: string): Effect => clueOf(SIWOO, clueId);
export const momClue = (clueId: string): Effect => clueOf(HYEJIN, clueId);
export const momTrust = (amount: number): Effect => trust(HYEJIN, amount);
export const trusts = (operator: ComparisonOperator, value: number): Condition => trustIs(HYEJIN, operator, value);

import type { ComparisonOperator, Condition, Effect } from "@/game/types";
import { clueOf, trust, trustIs } from "../shared/helpers";

export * from "../shared/helpers";

/** 문순례 (76): the patient, and the relationship axis. */
export const SUNRYE = "sunrye";

export const clue = (clueId: string): Effect => clueOf(SUNRYE, clueId);
export const herTrust = (amount: number): Effect => trust(SUNRYE, amount);
export const trusts = (operator: ComparisonOperator, value: number): Condition => trustIs(SUNRYE, operator, value);

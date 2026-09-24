import { ABILITY_NAMES, type AbilityName } from "./types";

export const ABILITY_PRESENTATION: Record<AbilityName, { symbol: string; name: string }> = {
  observation: { symbol: "◉", name: "관찰" },
  history: { symbol: "?", name: "문진" },
  empathy: { symbol: "∿", name: "공감" },
  mechanism: { symbol: "⟳", name: "기전" },
  reasoning: { symbol: "△", name: "추론" },
  suspicion: { symbol: "／", name: "의심" },
  decision: { symbol: "■", name: "결단" },
};

export const zeroResonance = (): Record<AbilityName, number> =>
  Object.fromEntries(ABILITY_NAMES.map((ability) => [ability, 0])) as Record<AbilityName, number>;

export function formatGameTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

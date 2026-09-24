export interface RandomResult {
  value: number;
  state: number;
}

/** A small deterministic xorshift32 generator. State must always be persisted. */
export function nextRandom(seed: number): RandomResult {
  let state = seed | 0;
  if (state === 0) state = 0x6d2b79f5;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return { value: (state >>> 0) / 0x1_0000_0000, state: state >>> 0 };
}

export function rollDie(seed: number, sides: number): { roll: number; state: number } {
  const next = nextRandom(seed);
  return { roll: Math.floor(next.value * sides) + 1, state: next.state };
}

import type { GameState, NarrativeBlock } from "@/game/types";

/** Keeps authored text intact while limiting reflection voices by the run's resonance. */
export function selectReflectionBlocks(blocks: NarrativeBlock[], state: GameState, limit = 4) {
  const thoughts = blocks.filter((block): block is Extract<NarrativeBlock,{type:"thought"}> => block.type === "thought");
  const selected = new Set(thoughts.sort((a,b)=>(b.ability ? state.resonance[b.ability] : 0)-(a.ability ? state.resonance[a.ability] : 0)).slice(0,limit));
  return blocks.filter(block=>block.type!=="thought"||selected.has(block));
}

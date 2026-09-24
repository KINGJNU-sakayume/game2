import type { NarrativeBlock as NarrativeBlockType } from "@/game/types";

export function NarrativeBlock({ block }: { block: NarrativeBlockType }) {
  if (block.type === "dialogue") return (
    <blockquote className="my-5 border-l border-amber-300/40 pl-4">
      <span className="mb-1 block text-xs font-semibold tracking-[.18em] text-amber-200">{block.speaker}</span>
      <p className="text-lg leading-8 text-stone-100">{block.text}</p>
    </blockquote>
  );
  const styles = block.type === "thought" ? "italic text-stone-400" : block.type === "system" ? "rounded-lg bg-white/5 p-4 text-sm text-stone-400" : "text-stone-200";
  return <p className={`my-5 whitespace-pre-line leading-8 ${styles}`}>{block.type === "thought" && block.label ? <strong className="mr-2 not-italic text-amber-200">{block.label}</strong> : null}{block.text}</p>;
}

import type { NarrativeBlock as NarrativeBlockType } from "@/game/types";
import { MindVoice } from "./MindVoice";

export function NarrativeBlock({ block }: { block: NarrativeBlockType }) {
  if (block.type === "dialogue") return (
    <blockquote className="dialogue-block">
      <span>{block.speaker}</span>
      <p>{block.text}</p>
    </blockquote>
  );
  if (block.type === "thought") return <MindVoice ability={block.ability} label={block.label}>{block.text}</MindVoice>;
  const styles = block.type === "system" ? "system-block" : "prose-block";
  return <p className={styles}>{block.text}</p>;
}

"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { ABILITY_PRESENTATION } from "@/game/abilities";
import type { CharacterDefinition } from "@/game/types";
import { spokenText, type Beat } from "@/game/presentation/beats";
import { Sheet } from "./Sheet";

export type LogEntry = { id: number } & (Beat | { kind: "choice"; text: string });

/** Everything read this session, newest at the bottom. */
export function BacklogSheet({ open, onClose, entries, characters }: {
  open: boolean;
  onClose: () => void;
  entries: LogEntry[];
  characters?: Record<string, CharacterDefinition>;
}) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "end" }); }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="지난 대사" closeLabel="지난 대사 닫기">
      {!entries.length ? <p className="chart-empty">아직 읽은 대사가 없다.</p> : (
        <ol className="backlog">
          {entries.map((entry) => {
            if (entry.kind === "dialogue") {
              const character = characters?.[entry.speaker];
              return <li key={entry.id} data-kind="dialogue" data-tone={character?.tone ?? "slate"}><strong>{character?.name ?? entry.speaker}</strong><p>{spokenText(entry.text)}</p></li>;
            }
            if (entry.kind === "thought") {
              const ability = entry.ability ? ABILITY_PRESENTATION[entry.ability] : undefined;
              return <li key={entry.id} data-kind="thought" style={{ "--ability": `var(--ab-${entry.ability ?? "reasoning"})` } as CSSProperties}><strong>{ability ? `${ability.symbol} ${ability.name}` : entry.label}</strong><p>{entry.text}</p></li>;
            }
            if (entry.kind === "choice") return <li key={entry.id} data-kind="choice"><p>{entry.text}</p></li>;
            return <li key={entry.id} data-kind={entry.kind}><p>{entry.text}</p></li>;
          })}
          <li ref={end} className="backlog-end" aria-hidden="true" />
        </ol>
      )}
    </Sheet>
  );
}

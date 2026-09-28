"use client";
import type { CSSProperties, ReactNode } from "react";
import { ABILITY_PRESENTATION } from "@/game/abilities";
import type { CharacterDefinition } from "@/game/types";
import { spokenText, type Beat, type Page } from "@/game/presentation/beats";
import { IconNext } from "./icons";

export interface ReadingView {
  page?: Page;
  /** Beats of the page currently revealed. */
  count: number;
  /** The typed portion of the newest beat. */
  typed: string;
  typing: boolean;
}

const abilityStyle = (ability?: string) => ({ "--ability": `var(--ab-${ability ?? "reasoning"})` }) as CSSProperties;

function Voice({ beat, text }: { beat: Extract<Beat, { kind: "thought" }>; text: string }) {
  const presentation = beat.ability ? ABILITY_PRESENTATION[beat.ability] : undefined;
  return (
    <div className="voice" style={abilityStyle(beat.ability)}>
      <span className="voice-tag"><span aria-hidden="true">{presentation?.symbol}</span>{presentation?.name ?? beat.label}</span>
      <p>{text}</p>
    </div>
  );
}

function Readout({ beat, text }: { beat: Extract<Beat, { kind: "system" }>; text: string }) {
  if (beat.variant === "stamp") return <p className="stamp">{text}</p>;
  if (beat.variant === "note") {
    const [heading, ...rest] = text.split("\n");
    const hasHeading = rest.length > 0 && rest[0] === "";
    return (
      <div className="note-card">
        {hasHeading ? <><strong>{heading}</strong><p>{rest.slice(1).join("\n")}</p></> : <p>{text}</p>}
      </div>
    );
  }
  return <pre className="readout">{text}</pre>;
}

/** Renders one page, with only the newest beat still typing. */
export function PageBody({ view, characters, showRole }: { view: ReadingView; characters?: Record<string, CharacterDefinition>; showRole?: (speaker: string) => boolean }) {
  const { page, count, typed } = view;
  if (!page) return null;
  const beats = page.beats.slice(0, count);
  const textOf = (beat: Beat, index: number) => {
    const full = beat.kind === "dialogue" ? spokenText(beat.text) : beat.text;
    return index === beats.length - 1 ? typed : full;
  };
  if (page.kind === "dialogue") {
    const speaker = page.speaker ?? "";
    const character = characters?.[speaker];
    return (
      <div className={`speech ${character?.isPlayer ? "is-player" : ""}`} data-tone={character?.tone ?? "slate"}>
        <p className="speaker"><span className="speaker-name">{character?.name ?? speaker}</span>{character?.role && showRole?.(speaker) && <span className="speaker-role">{character.role}</span>}</p>
        {beats.map((beat, index) => <p key={index} className="line line--speech">{textOf(beat, index)}</p>)}
      </div>
    );
  }
  if (page.kind === "thought") return <div className="voices">{beats.map((beat, index) => beat.kind === "thought" && <Voice key={index} beat={beat} text={textOf(beat, index)} />)}</div>;
  if (page.kind === "system") return <>{beats.map((beat, index) => beat.kind === "system" && <Readout key={index} beat={beat} text={textOf(beat, index)} />)}</>;
  return <div className="prose">{beats.map((beat, index) => <p key={index} className="line line--prose">{textOf(beat, index)}</p>)}</div>;
}

/**
 * The reading panel. Tapping it advances just like tapping the stage; the
 * chevron (or the next action’s label) shows when the line is finished.
 */
export function DialogueBox({ view, characters, showRole, prompt, hint, onAdvance, children, compact = false }: {
  view: ReadingView;
  characters?: Record<string, CharacterDefinition>;
  showRole?: (speaker: string) => boolean;
  prompt?: string;
  hint?: { label?: string };
  onAdvance?: () => void;
  children?: ReactNode;
  compact?: boolean;
}) {
  const kind = view.page?.kind ?? "prompt";
  const fullText = view.page ? view.page.beats.slice(0, view.count).map((beat) => beat.kind === "dialogue" ? `${beat.speaker}: ${spokenText(beat.text)}` : beat.text).join("\n") : prompt ?? "";
  return (
    <section className={`dialogue ${compact ? "is-compact" : ""}`} data-kind={kind} aria-label="대사">
      <div className="dialogue-body" onClick={onAdvance}>
        <p className="sr-only" aria-live="polite">{fullText}</p>
        <div aria-hidden="true">
          {view.page ? <PageBody view={view} characters={characters} showRole={showRole} /> : prompt && <p className="prompt">{prompt}</p>}
        </div>
        {hint && !view.typing && (
          <span className={`advance ${hint.label ? "has-label" : ""}`} aria-hidden="true">{hint.label}<IconNext width={16} height={16} /></span>
        )}
      </div>
      {children}
    </section>
  );
}

import type { AbilityName, NarrativeBlock } from "@/game/types";

/**
 * A beat is one tap of reading. Consecutive beats of the same kind share a page
 * so short, rhythmic lines (“박자. / 한 번. / 두 번.”) build up on screen
 * instead of replacing each other.
 */
export type Beat =
  | { kind: "prose"; text: string }
  | { kind: "dialogue"; speaker: string; text: string }
  | { kind: "thought"; ability?: AbilityName; label?: string; text: string }
  | { kind: "system"; variant: "readout" | "stamp" | "note"; text: string };

export interface Page { kind: Beat["kind"]; speaker?: string; beats: Beat[] }
/** Reading position: the page on screen and how many of its beats are revealed. */
export interface Step { page: number; count: number }

export interface PageLimits { lines: number; dialogueBeats: number; thoughtBeats: number }
export const DEFAULT_LIMITS: PageLimits = { lines: 6, dialogueBeats: 4, thoughtBeats: 3 };
export const IMMERSIVE_LIMITS: PageLimits = { lines: 5, dialogueBeats: 3, thoughtBeats: 2 };

export function toBeat(block: NarrativeBlock): Beat {
  switch (block.type) {
    case "prose": return { kind: "prose", text: block.text };
    case "dialogue": return { kind: "dialogue", speaker: block.speaker, text: block.text };
    case "thought": return { kind: "thought", ability: block.ability, label: block.label, text: block.text };
    case "system": return { kind: "system", variant: block.variant ?? "readout", text: block.text };
  }
}

export const lineCount = (text: string) => text.split("\n").length;
const pageLines = (page: Page) => page.beats.reduce((total, beat) => total + lineCount(beat.text), 0);

function joins(page: Page | undefined, beat: Beat, limits: PageLimits): boolean {
  if (!page || page.kind !== beat.kind) return false;
  const fits = pageLines(page) + lineCount(beat.text) <= limits.lines;
  switch (beat.kind) {
    case "prose": return fits;
    case "dialogue": return fits && page.speaker === beat.speaker && page.beats.length < limits.dialogueBeats;
    case "thought": return fits && page.beats.length < limits.thoughtBeats;
    case "system": return false;
  }
}

export function paginate(beats: readonly Beat[], limits: PageLimits = DEFAULT_LIMITS): Page[] {
  const pages: Page[] = [];
  for (const beat of beats) {
    const last = pages.at(-1);
    if (joins(last, beat, limits)) last!.beats.push(beat);
    else pages.push({ kind: beat.kind, speaker: beat.kind === "dialogue" ? beat.speaker : undefined, beats: [beat] });
  }
  return pages;
}

export function toSteps(pages: readonly Page[]): Step[] {
  return pages.flatMap((page, index) => page.beats.map((_, beat) => ({ page: index, count: beat + 1 })));
}

/** Dialogue is written with quotation marks; the speaker tag already marks speech. */
export function spokenText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("“") && trimmed.endsWith("”") && trimmed.indexOf("”") === trimmed.length - 1) return trimmed.slice(1, -1);
  return trimmed;
}

/** Labels written as quotations are things the player says aloud. */
export const isSpokenLabel = (label: string) => label.trim().startsWith("“");

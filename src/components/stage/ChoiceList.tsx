"use client";
import type { CSSProperties } from "react";
import { ABILITY_PRESENTATION } from "@/game/abilities";
import type { Choice } from "@/game/types";
import { isSpokenLabel } from "@/game/presentation/beats";

/** Old content prefixed check labels with the ability (“∿ 공감 — …”); the tag now comes from data. */
const displayLabel = (label: string) => label.replace(/^\S\s[가-힣]{2}\s—\s/, "");

/**
 * Choice cards. A quoted label is something said aloud; an ability tag marks
 * a roll — the tag names the ability, never the odds.
 */
export function ChoiceList({ choices, disabled, onChoose, heading, compact = false }: {
  choices: Choice[];
  disabled: boolean;
  onChoose: (id: string) => void;
  heading?: string;
  /** Two columns of short labels, used over photographs the player explores. */
  compact?: boolean;
}) {
  if (!choices.length) return null;
  return (
    <div className={`choices ${compact ? "is-compact" : ""}`} role="group" aria-label={heading ?? "선택지"}>
      {heading && <p className="choices-heading">{heading}</p>}
      {choices.map((choice, index) => {
        const ability = choice.check ? ABILITY_PRESENTATION[choice.check.ability] : undefined;
        const label = displayLabel(choice.label);
        return (
          <button
            key={choice.id}
            type="button"
            className={`choice ${isSpokenLabel(label) ? "is-spoken" : ""} ${ability ? "is-check" : ""}`}
            style={{ "--i": index, ...(choice.check ? { "--ability": `var(--ab-${choice.check.ability})` } : {}) } as CSSProperties}
            disabled={disabled}
            onClick={(event) => { event.stopPropagation(); onChoose(choice.id); }}
            aria-label={choice.ariaLabel ?? (ability ? `${choice.label} (${ability.name} 판정)` : choice.label)}
          >
            <span className="choice-index" aria-hidden="true">{index + 1}</span>
            <span className="choice-label">{label}</span>
            {ability && <span className="choice-check" aria-hidden="true">{ability.symbol} {ability.name}</span>}
          </button>
        );
      })}
    </div>
  );
}

import type { Choice } from "@/game/types";
export function ChoiceButton({ choice, disabled, onChoose }: { choice: Choice; disabled: boolean; onChoose: () => void }) {
  return <button className="choice-button" type="button" disabled={disabled} onClick={onChoose} aria-label={choice.ariaLabel ?? choice.label}>{choice.label}</button>;
}

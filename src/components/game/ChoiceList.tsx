import type { Choice } from "@/game/types";
import { ChoiceButton } from "./ChoiceButton";

export function ChoiceList({ choices, disabled, onChoose }: { choices: Choice[]; disabled: boolean; onChoose: (id: string) => void }) {
  if (!choices.length) return <p className="mt-10 text-sm text-stone-500" role="status">이 장면의 끝입니다.</p>;
  return (
    <div className="mt-10 grid gap-3" aria-label="선택지">
      {choices.map((choice) => <ChoiceButton key={choice.id} choice={choice} disabled={disabled} onChoose={() => onChoose(choice.id)} />)}
    </div>
  );
}

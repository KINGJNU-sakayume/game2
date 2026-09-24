import type { Choice } from "@/game/types";

export function ChoiceList({ choices, disabled, onChoose }: { choices: Choice[]; disabled: boolean; onChoose: (id: string) => void }) {
  if (!choices.length) return <p className="mt-10 text-sm text-stone-500" role="status">이 장면의 끝입니다.</p>;
  return (
    <div className="mt-10 grid gap-3" aria-label="선택지">
      {choices.map((choice, index) => (
        <button key={choice.id} type="button" disabled={disabled} onClick={() => onChoose(choice.id)} aria-label={choice.ariaLabel ?? choice.label}
          className="min-h-14 rounded-xl border border-white/10 bg-white/[.04] px-5 py-4 text-left text-base leading-6 text-stone-100 transition hover:border-amber-300/40 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none">
          <span className="mr-3 text-xs text-amber-200/60" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{choice.label}
        </button>
      ))}
    </div>
  );
}

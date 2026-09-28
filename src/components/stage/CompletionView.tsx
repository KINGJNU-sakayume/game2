import type { CSSProperties } from "react";
import { ABILITY_PRESENTATION } from "@/game/abilities";
import type { AbilityName, CaseArchive, CaseMemory, Choice } from "@/game/types";

/** End of a case: the memory it leaves behind, what grew, and where to go next. */
export function CompletionView({ caseId, memory, archive, growth, choices, disabled, onChoose }: {
  caseId?: string;
  memory?: CaseMemory;
  archive?: CaseArchive;
  growth?: AbilityName;
  choices: Choice[];
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  const grown = growth ? ABILITY_PRESENTATION[growth] : undefined;
  const [primary, ...rest] = choices;
  return (
    <section className="completion" aria-label="사건 종결" onClick={(event) => event.stopPropagation()}>
      <p className="completion-kicker">{caseId}</p>
      <h2 className="completion-title">사건 종결</h2>
      {archive?.endingTitle && <p className="completion-ending">{archive.endingTitle}</p>}
      {memory && (
        <div className="memory-card">
          <span className="memory-kicker">Case Memory</span>
          <strong>{memory.title}</strong>
          <p>{memory.description}</p>
        </div>
      )}
      {grown && (
        <p className="growth" style={{ "--ability": `var(--ab-${growth})` } as CSSProperties}>
          <span aria-hidden="true">{grown.symbol}</span> {grown.name}이 한 단계 깊어졌다
        </p>
      )}
      <div className="completion-actions">
        {primary && <button type="button" className="button-primary" disabled={disabled} onClick={() => onChoose(primary.id)}>{primary.label}</button>}
        {rest.map((choice) => <button key={choice.id} type="button" className="button-quiet" disabled={disabled} onClick={() => onChoose(choice.id)}>{choice.label}</button>)}
      </div>
    </section>
  );
}

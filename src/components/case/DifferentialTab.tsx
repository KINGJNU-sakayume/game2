import { evaluateConditions } from "@/game/engine/conditionResolver";
import type { ChapterDefinition, DiagnosisRule, GameState } from "@/game/types";

function visible(rules: DiagnosisRule[] | undefined, state: GameState) {
  return (rules ?? []).filter((rule) => evaluateConditions(rule.conditions, state));
}

function RuleList({ title, tone, rules, state }: { title: string; tone: "for" | "against" | "unknown"; rules?: DiagnosisRule[]; state: GameState }) {
  const items = visible(rules, state);
  return (
    <div className="reasons" data-tone={tone}>
      <h4>{title}</h4>
      {items.length ? <ul>{items.map((rule, index) => <li key={`${rule.text}-${index}`}>{rule.text}</li>)}</ul> : <p>아직 없음</p>}
    </div>
  );
}

export function DifferentialTab({ chapter, state, onPrimary, onMove, onLink }: {
  chapter: ChapterDefinition;
  state: GameState;
  onPrimary: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onLink: (diagnosisId: string, clueId: string) => void;
}) {
  const diagnoses = Object.entries(state.diagnosisState ?? {}).filter(([, value]) => value.unlocked).sort((a, b) => a[1].order - b[1].order);
  const clueIds = [...new Set(Object.values(state.patients).flatMap((patient) => patient.clues))].filter((id) => chapter.clueDefinitions?.[id]);
  if (!diagnoses.length) return <p className="chart-empty">아직 세운 감별진단이 없다.</p>;
  return (
    <div className="ddx-list">
      {diagnoses.map(([id, diagnosis], index) => {
        const definition = chapter.diagnosisDefinitions?.[id];
        if (!definition) return null;
        return (
          <article className={`ddx ${diagnosis.isPrimary ? "is-primary" : ""}`} key={id}>
            <header>
              <span className="ddx-rank" aria-hidden="true">{index + 1}</span>
              <div>
                <h3>{definition.nameKo}</h3>
                {definition.nameEn && <p>{definition.nameEn}</p>}
              </div>
              {diagnosis.isPrimary && <span className="ddx-primary">주진단</span>}
            </header>
            <div className="ddx-actions">
              <button type="button" onClick={() => onPrimary(id)} aria-pressed={diagnosis.isPrimary}>{diagnosis.isPrimary ? "주진단으로 두는 중" : "주진단으로 둔다"}</button>
              <button type="button" aria-label={`${definition.nameKo} 순위 올리기`} disabled={index === 0} onClick={() => onMove(id, -1)}>↑</button>
              <button type="button" aria-label={`${definition.nameKo} 순위 내리기`} disabled={index === diagnoses.length - 1} onClick={() => onMove(id, 1)}>↓</button>
            </div>
            <RuleList title="맞는 점" tone="for" rules={definition.supportRules} state={state} />
            <RuleList title="맞지 않는 점" tone="against" rules={definition.contradictionRules} state={state} />
            <RuleList title="아직 모르는 것" tone="unknown" rules={definition.unknownRules} state={state} />
            {!!clueIds.length && (
              <fieldset className="ddx-links">
                <legend>근거로 묶기</legend>
                <div>
                  {clueIds.map((clueId) => (
                    <button type="button" aria-pressed={diagnosis.linkedClues.includes(clueId)} onClick={() => onLink(id, clueId)} key={clueId}>{chapter.clueDefinitions?.[clueId].title}</button>
                  ))}
                </div>
              </fieldset>
            )}
          </article>
        );
      })}
    </div>
  );
}

import { evaluateConditions } from "@/game/engine/conditionResolver";
import type { ChapterDefinition, DiagnosisDefinition, DiagnosisRule, GameState } from "@/game/types";

function visible(rules: DiagnosisRule[] | undefined, state: GameState) { return (rules ?? []).filter(rule => evaluateConditions(rule.conditions, state)); }
function RuleList({ title, rules, state }: { title: string; rules?: DiagnosisRule[]; state: GameState }) {
  const items = visible(rules, state); return <div className="reason-list"><h4>{title}</h4>{items.length ? <ul>{items.map((rule,index) => <li key={`${rule.text}-${index}`}>{rule.text}</li>)}</ul> : <p>현재 기록 없음</p>}</div>;
}
export function DifferentialTab({ chapter, state, onPrimary, onMove, onLink }: { chapter: ChapterDefinition; state: GameState; onPrimary: (id:string)=>void; onMove:(id:string,direction:-1|1)=>void; onLink:(diagnosisId:string,clueId:string)=>void }) {
  const diagnoses = Object.entries(state.diagnosisState ?? {}).filter(([,value]) => value.unlocked).sort((a,b) => a[1].order-b[1].order);
  const clueIds = [...new Set(Object.values(state.patients).flatMap(patient => patient.clues))].filter(id => chapter.clueDefinitions?.[id]);
  return <div className="diagnosis-list">{diagnoses.map(([id,diagnosis],index) => { const definition = chapter.diagnosisDefinitions?.[id] as DiagnosisDefinition | undefined; if (!definition) return null; return <article className="diagnosis-row" key={id}>
    <header><div><h3>{definition.nameKo}</h3>{definition.nameEn && <p>{definition.nameEn}</p>}</div>{diagnosis.isPrimary && <span className="primary-badge">PRIMARY</span>}</header>
    <div className="diagnosis-actions"><button onClick={()=>onPrimary(id)} type="button" aria-pressed={diagnosis.isPrimary}>주진단으로 검증</button><button type="button" aria-label={`${definition.nameKo} Move up`} disabled={index===0} onClick={()=>onMove(id,-1)}>↑</button><button type="button" aria-label={`${definition.nameKo} Move down`} disabled={index===diagnoses.length-1} onClick={()=>onMove(id,1)}>↓</button></div>
    <RuleList title="Supports" rules={definition.supportRules} state={state}/><RuleList title="Contradictions" rules={definition.contradictionRules} state={state}/><RuleList title="Unknowns" rules={definition.unknownRules} state={state}/>
    {!!clueIds.length && <fieldset><legend>근거 연결</legend><div className="clue-links">{clueIds.map(clueId => <button type="button" aria-pressed={diagnosis.linkedClues.includes(clueId)} onClick={()=>onLink(id,clueId)} key={clueId}>{chapter.clueDefinitions?.[clueId].title}</button>)}</div></fieldset>}
  </article>; })}{!diagnoses.length && <p className="empty-state">아직 열린 감별진단이 없습니다.</p>}</div>;
}

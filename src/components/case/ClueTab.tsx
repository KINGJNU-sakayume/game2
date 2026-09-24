import type { ChapterDefinition, GameState } from "@/game/types";
const groups = { clinical: "임상", lab: "검사", history: "병력", environment: "환경" } as const;
export function ClueTab({ chapter, state }: { chapter: ChapterDefinition; state: GameState }) {
  const ids = [...new Set(Object.values(state.patients).flatMap(patient => patient.clues))];
  const clues = ids.flatMap(id => chapter.clueDefinitions?.[id] ? [chapter.clueDefinitions[id]] : []);
  return <div className="case-tab-content">{Object.entries(groups).map(([category, title]) => { const items = clues.filter(item => item.category === category); return items.length ? <section key={category}><h3>{title}</h3><ul className="case-list">{items.map(item => <li key={item.id}><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</li>)}</ul></section> : null; })}{!clues.length && <p className="empty-state">아직 기록된 단서가 없습니다.</p>}</div>;
}

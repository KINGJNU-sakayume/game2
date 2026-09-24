import type { ChapterDefinition, GameState, PatientState } from "@/game/types";
const labels: Record<PatientState["tests"][string], string> = { ordered: "검사 전", pending: "검사 중", complete: "결과 확인", positive: "양성", negative: "음성" };
export function TestsTab({ chapter, state }: { chapter: ChapterDefinition; state: GameState }) {
  const tests = Object.entries(state.patients.harin?.tests ?? {});
  return <div className="case-tab-content"><ul className="case-list tests-list">{tests.map(([id,status]) => { const definition = chapter.testDefinitions?.[id]; if (!definition) return null; return <li key={id} data-status={status}><div><strong>{definition.nameKo}</strong>{definition.nameEn && <small>{definition.nameEn}</small>}</div><span className="status-label">{labels[status]}</span></li>; })}</ul>{!tests.length && <p className="empty-state">아직 요청한 검사가 없습니다.</p>}</div>;
}

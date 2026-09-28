import type { ChapterDefinition, GameState, PatientState } from "@/game/types";

const labels: Record<PatientState["tests"][string], string> = { ordered: "의뢰됨", pending: "검사 중", complete: "결과 확인", positive: "양성", negative: "음성" };

export function TestsTab({ chapter, state }: { chapter: ChapterDefinition; state: GameState }) {
  const patients = Object.values(state.patients);
  const rows = patients.flatMap((patient) => Object.entries(patient.tests).map(([id, status]) => ({ patient, id, status })));
  const visibleRows = rows.filter(({ id }) => chapter.testDefinitions?.[id]);
  if (!visibleRows.length) return <p className="chart-empty">아직 보낸 검사가 없다.</p>;
  return (
    <ul className="test-list">
      {visibleRows.map(({ patient, id, status }) => {
        const definition = chapter.testDefinitions![id];
        return (
          <li key={`${patient.id}-${id}`} data-status={status}>
            <div>
              <strong>{definition.nameKo}</strong>
              <small>{[definition.nameEn, patients.length > 1 ? patient.name : undefined].filter(Boolean).join(" · ")}</small>
            </div>
            <span className="test-stamp">{labels[status]}</span>
          </li>
        );
      })}
    </ul>
  );
}

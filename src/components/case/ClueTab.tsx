import type { ChapterDefinition, GameState } from "@/game/types";

const groups = { clinical: "임상", lab: "검사", history: "병력", environment: "환경" } as const;

export function ClueTab({ chapter, state }: { chapter: ChapterDefinition; state: GameState }) {
  const ids = [...new Set(Object.values(state.patients).flatMap((patient) => patient.clues))];
  const clues = ids.flatMap((id) => chapter.clueDefinitions?.[id] ? [chapter.clueDefinitions[id]] : []);
  if (!clues.length) return <p className="chart-empty">아직 적어둔 단서가 없다.</p>;
  return (
    <div className="chart-clues">
      {Object.entries(groups).map(([category, title]) => {
        const items = clues.filter((item) => item.category === category);
        if (!items.length) return null;
        return (
          <section key={category} className="chart-section" data-category={category}>
            <h3>{title}<span>{items.length}</span></h3>
            <ul className="clue-list">
              {items.map((item) => <li key={item.id}><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

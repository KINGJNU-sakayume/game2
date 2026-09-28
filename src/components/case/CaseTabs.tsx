import type { ChapterDefinition, GameState } from "@/game/types";
import { ClueTab } from "./ClueTab";
import { DifferentialTab } from "./DifferentialTab";
import { TestsTab } from "./TestsTab";
import { TimelineTab } from "./TimelineTab";

export type CaseTabId = "clues" | "ddx" | "tests" | "time";
const tabs: { id: CaseTabId; label: string }[] = [
  { id: "clues", label: "단서" },
  { id: "ddx", label: "감별" },
  { id: "tests", label: "검사" },
  { id: "time", label: "경과" },
];

export function CaseTabs({ active, onChange, chapter, state, onPrimary, onMove, onLink }: {
  active: CaseTabId;
  onChange: (id: CaseTabId) => void;
  chapter: ChapterDefinition;
  state: GameState;
  onPrimary: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onLink: (diagnosisId: string, clueId: string) => void;
}) {
  return (
    <>
      <div className="chart-tabs" role="tablist" aria-label="환자 기록">
        {tabs.map((tab) => (
          <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => onChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="chart-panel" role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} tabIndex={0}>
        {active === "clues" ? <ClueTab chapter={chapter} state={state} />
          : active === "ddx" ? <DifferentialTab chapter={chapter} state={state} onPrimary={onPrimary} onMove={onMove} onLink={onLink} />
          : active === "tests" ? <TestsTab chapter={chapter} state={state} />
          : <TimelineTab state={state} />}
      </div>
    </>
  );
}

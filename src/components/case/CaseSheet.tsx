"use client";
import { useState } from "react";
import type { ChapterDefinition, GameState } from "@/game/types";
import { Sheet } from "@/components/stage/Sheet";
import { CaseTabs, type CaseTabId } from "./CaseTabs";

export function CaseSheet({ open, onClose, chapter, state, onPrimary, onMove, onLink }: {
  open: boolean;
  onClose: () => void;
  chapter: ChapterDefinition;
  state: GameState;
  onPrimary: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onLink: (diagnosisId: string, clueId: string) => void;
}) {
  const [tab, setTab] = useState<CaseTabId>("clues");
  const patient = chapter.outcomes ? state.patients[chapter.outcomes.patientId] : Object.values(state.patients)[0];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      className="chart"
      closeLabel="환자 기록 닫기"
      kicker={chapter.completion?.archive.caseId ?? chapter.title}
      title={patient ? <>{patient.name}<small> 환자 기록</small></> : "환자 기록"}
    >
      <CaseTabs active={tab} onChange={setTab} chapter={chapter} state={state} onPrimary={onPrimary} onMove={onMove} onLink={onLink} />
    </Sheet>
  );
}

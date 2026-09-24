import type { ChapterDefinition } from "@/game/types";
import { hospitalChapter } from "./hospital";
import { fieldNodes } from "./field";
import { deteriorationNodes } from "./deterioration";
import { differentialNodes } from "./differential";
import { resolutionNodes } from "./resolution";
import { chapter01ArchiveDefinition } from "@/game/engine/endingResolver";
import { chapter01Clues, chapter01Diagnoses, chapter01Tests } from "./caseData";

export { defaultPlayer } from "./hospital";
export const chapter01: ChapterDefinition = {
  ...hospitalChapter,
  initial: {
    ...hospitalChapter.initial,
    flags: {
      ...hospitalChapter.initial?.flags,
      hospital_extra_complete: false,
      family_privacy_requested: false,
      lead_poisoning_available: false,
      acute_hepatic_porphyria_available: false,
      diagnostic_anchoring: false,
      field_overstay: false,
    },
  },
  nodes: { ...hospitalChapter.nodes, ...fieldNodes, ...deteriorationNodes, ...differentialNodes, ...resolutionNodes },
  completion: { caseId: "chapter-01", memory: { id: "normal_is_not_diagnosis", title: "정상은 진단이 아니다", description: "정상 검사는 한 가설의 가능성을 낮출 수 있다. 환자가 정상이라는 뜻은 아니다.", sourceChapter: "chapter-01" }, archive: chapter01ArchiveDefinition },
  clueDefinitions: chapter01Clues,
  diagnosisDefinitions: chapter01Diagnoses,
  testDefinitions: chapter01Tests,
};
export const demoChapter = chapter01;

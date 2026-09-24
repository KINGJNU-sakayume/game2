import type { ChapterDefinition } from "@/game/types";
import { hospitalChapter } from "./hospital";
import { fieldNodes } from "./field";
import { deteriorationNodes } from "./deterioration";
import { differentialNodes } from "./differential";

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
  nodes: { ...hospitalChapter.nodes, ...fieldNodes, ...deteriorationNodes, ...differentialNodes },
};
export const demoChapter = chapter01;

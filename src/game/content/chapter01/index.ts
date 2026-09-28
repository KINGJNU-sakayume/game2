import type { ArchiveDefinition, ChapterDefinition, OutcomeRules } from "@/game/types";
import { hospitalInitial, hospitalNodes } from "./hospital";
import { fieldNodes } from "./field";
import { deteriorationNodes } from "./deterioration";
import { differentialNodes } from "./differential";
import { resolutionNodes } from "./resolution";
import { chapter01Clues, chapter01Diagnoses, chapter01Tests } from "./caseData";
import { chapter01VisualAssets } from "./visualAssets";
import { assembleNodeSources } from "./graphValidator";
import { PLAYER } from "../shared/helpers";

export { defaultPlayer } from "./hospital";

export const chapter01ArchiveDefinition: ArchiveDefinition = {
  caseId: "CASE 01",
  title: "아무것도 없는 배",
  finalDiagnosis: "급성 간헐성 포르피린증 / Acute Intermittent Porphyria",
  biochemicalDiagnosis: "소변 PBG/ALA 상승으로 확인된 급성 간성 포르피린증",
  subtypeConfirmation: "HMBS pathogenic variant",
  complications: ["저나트륨혈증", "운동신경병증", "신경정신 증상"],
  labels: { biochemicalDiagnosis: "생화학적 확인", subtypeConfirmation: "아형 확인" },
  firstHypothesis: {
    valueKey: "initial_anchor",
    labels: { acute_abdomen: "급성 복부 질환", toxic_drug: "독성 · 약물", endocrine_autonomic: "내분비 · 자율신경", functional_psychiatric: "기능성 · 정신과적", neurologic: "신경학적" },
  },
};

export const chapter01Outcomes: OutcomeRules = {
  patientId: "harin",
  triggers: [
    { flag: "restricted_diet_known", label: "심한 열량 제한" },
    { flag: "ocp_known", label: "호르몬 노출" },
  ],
  relationship: { brokenBelow: 20, trustedAt: 60, boundaryFlag: "family_boundary_broken", repairFlag: "patient_apology_given" },
  severeDelayFlag: "treatment_delay_significant",
  transferFlag: "follow_up_transferred",
  outcomeText: {
    END_A: "급성 발작 치료 후 회복 · 무대 복귀",
    END_B: "잔여 근력저하로 보행 재활 필요",
    END_C: "급성 발작 치료 후 회복",
    END_D: "급성 발작 치료 후 회복 · 재발 위험 남음",
    END_E: "다른 진료팀의 재평가로 진단",
  },
  followUpText: {
    trusted: "환자 메시지와 외래 추적",
    guarded: "외래 기록으로 추적",
    broken: "다른 진료팀으로 후속 진료 전환",
  },
};

export const chapter01: ChapterDefinition = {
  id: "chapter-01",
  number: 1,
  title: "CHAPTER 1 — 아무것도 없는 배",
  subtitle: "아무것도 없는 배",
  synopsis: "리허설 도중 쓰러진 스물여덟 살 앙상블 배우. 세 번째 응급실, 세 번째 정상 CT. 배는 아무 말도 하지 않는다.",
  cover: { assetId: "SCN_004_REHEARSAL_EMPTY" },
  startNodeId: "PR_001",
  initial: {
    ...hospitalInitial,
    flags: {
      ...hospitalInitial.flags,
      hospital_extra_complete: false,
      family_privacy_requested: false,
      lead_poisoning_available: false,
      acute_hepatic_porphyria_available: false,
      diagnostic_anchoring: false,
      field_overstay: false,
    },
  },
  nodes: assembleNodeSources(hospitalNodes, fieldNodes, deteriorationNodes, differentialNodes, resolutionNodes),
  visualAssets: chapter01VisualAssets,
  characters: {
    [PLAYER]: { name: PLAYER, role: "진단팀 당직의", tone: "ink", isPlayer: true },
    윤하린: { name: "윤하린", role: "환자 · 뮤지컬 앙상블 배우", tone: "rose" },
    강수진: { name: "강수진", role: "응급실 간호사", tone: "teal" },
    정세영: { name: "정세영", role: "하린의 동료 배우", tone: "amber" },
    윤미정: { name: "윤미정", role: "하린의 어머니", tone: "clay" },
    무대감독: { name: "무대감독", tone: "slate" },
    목소리: { name: "목소리", role: "응급실 · 전화", tone: "slate" },
  },
  outcomes: chapter01Outcomes,
  completion: {
    caseId: "chapter-01",
    memory: { id: "normal_is_not_diagnosis", title: "정상은 진단이 아니다", description: "정상 검사는 한 가설의 가능성을 낮출 수 있다. 환자가 정상이라는 뜻은 아니다.", sourceChapter: "chapter-01" },
    archive: chapter01ArchiveDefinition,
    nodeId: "CASE_COMPLETE",
  },
  clueDefinitions: chapter01Clues,
  diagnosisDefinitions: chapter01Diagnoses,
  testDefinitions: chapter01Tests,
};

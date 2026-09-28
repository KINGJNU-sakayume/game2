import type { StoryNode } from "@/game/types";
import { HARIN, d, flag, go, log, minutes, p, primary, s, setFlag, setValue, test, thought, timeAtLeast, when } from "./helpers";

/** PBG ordered after 00:30 counts as a late diagnosis (field overstay, detours). */
const LATE_DIAGNOSIS_AT = 1470;

export const differentialNodes: Record<string, StoryNode> = {
  CASE_003: {
    id: "CASE_003",
    title: "감별진단",
    presentation: { prompt: "지금의 소견을 가장 잘 묶는 가설은." },
    blocks: [],
    choices: [
      { id: "porphyria", label: "급성 간성 포르피린증", effects: primary("acute_hepatic_porphyria"), next: "DX_PORPH_01" },
      { id: "lead", label: "납중독", effects: primary("lead_poisoning"), next: "DX_LEAD_01" },
      { id: "gbs", label: "길랭-바레증후군", effects: primary("guillain_barre"), next: "DX_GBS_01" },
      { id: "pheo", label: "갈색세포종", effects: primary("pheochromocytoma"), next: "DX_PHEO_01" },
      { id: "toxic", label: "약물 · 독성", effects: primary("toxic_drug"), next: "DX_TOXIC_01" },
      { id: "psych", label: "기능성 · 정신과적 원인", effects: primary("functional_psychiatric"), next: "DX_PSYCH_01" },
    ],
  },
  DX_LEAD_01: {
    id: "DX_LEAD_01",
    blocks: [thought("reasoning", "복통.\n변비.\n운동신경."), thought("mechanism", "설명 가능하다."), p("혈중 납 결과를 기다린다.")],
    onEnter: [minutes(20), when([flag("hosp_lead_checked", false)], [test(HARIN, "blood_lead", "pending")])],
    choices: go("DX_LEAD_02", "결과를 확인한다"),
  },
  DX_LEAD_02: {
    id: "DX_LEAD_02",
    blocks: [s("혈중 납 · 진단적 수준의 농도 아님"), thought("reasoning", "틀린 질문은 아니었다.\n\n하지만 답은 아니다.")],
    onEnter: [test(HARIN, "blood_lead", "negative"), log("lead-negative", "혈중 납: 진단적 수준 아님", "test")],
    choices: go("CASE_003", "감별진단을 다시 검토한다"),
  },
  DX_GBS_01: {
    id: "DX_GBS_01",
    blocks: [thought("mechanism", "신경병증 자체는 설명한다."), thought("reasoning", "그런데 복통이 먼저였다.\n\n고혈압은?\n\n저나트륨은?\n\n반복 발작은?")],
    choices: [{ id: "review", label: "가설을 다시 검토한다", next: "CASE_003" }],
  },
  DX_PHEO_01: {
    id: "DX_PHEO_01",
    blocks: [thought("reasoning", "고혈압과 빈맥은 맞는다.\n\n나머지는?"), p("확인 검사는 오늘 밤의 결정을 안내하기에는 느리다.")],
    choices: go("CASE_003", "감별진단을 다시 검토한다"),
  },
  DX_TOXIC_01: {
    id: "DX_TOXIC_01",
    blocks: [thought("reasoning", "노출과 약물은 확인할 가치가 있다.\n\n하지만 지금의 전체 패턴을 하나로 설명하는가?")],
    choices: go("CASE_003", "감별진단을 다시 검토한다"),
  },
  DX_PSYCH_01: {
    id: "DX_PSYCH_01",
    blocks: [thought("reasoning", "그러면 Na 121을 설명해.\n\n근력저하는?\n\n고혈압은?\n\n변비는?"), p("그리고 이모는?", [flag("family_history_known")])],
    choices: [
      { id: "review", label: "가설을 다시 검토한다", next: "CASE_003" },
      { id: "anchor", label: "이 가설을 유지한다", effects: [...primary("functional_psychiatric"), setFlag("diagnostic_anchoring")], next: "DX_PSYCH_REVIEW" },
    ],
  },
  DX_PSYCH_REVIEW: {
    id: "DX_PSYCH_REVIEW",
    blocks: [p("차트에 가설을 적는다."), thought("suspicion", "적는 순간부터\n그 문장이 나 대신 생각하기 시작한다.", 2)],
    choices: [
      ...go("CASE_003", "새 정보와 함께 다시 검토한다"),
      { id: "defer-pbg", label: "기능성 · 정신과적 원인을 주진단으로 두고 포르피린 검사를 보류한다", conditions: [flag("diagnostic_anchoring")], next: "FAIL_001" },
    ],
  },
  DX_PORPH_01: {
    id: "DX_PORPH_01",
    blocks: [s("주진단 가설 · 급성 간성 포르피린증"), thought("mechanism", "설명은 된다."), thought("reasoning", "그럼 증명해.")],
    choices: go("TEST_PORPH_01", "확인 검사를 고른다"),
  },
  TEST_PORPH_01: {
    id: "TEST_PORPH_01",
    presentation: { prompt: "급성 발작을 확인할 검사를 고른다." },
    blocks: [],
    choices: [
      { id: "pbg", label: "소변 PBG / ALA", next: "TEST_PBG_01" },
      { id: "genetic", label: "유전자검사", next: "TEST_GENETIC_01" },
      { id: "total", label: "총 소변 포르피린", next: "TEST_TOTALPOR_01" },
    ],
  },
  TEST_PBG_01: {
    id: "TEST_PBG_01",
    blocks: [s("스팟 소변 PBG / ALA\n발작 중 채취 · 차광 보관"), d("강수진", "“차광해서 바로 보낼게요.”"), thought("observation", "색으로 진단하는 병은 아니다."), thought("reasoning", "숫자로 확인한다.")],
    onEnter: [
      setFlag("pbg_ordered"),
      test(HARIN, "urine_pbg_ala", "pending"),
      log("pbg-ordered", "소변 PBG/ALA 의뢰", "test"),
      when([timeAtLeast(LATE_DIAGNOSIS_AT)], [setValue("diagnosis_outcome", "late"), setFlag("diagnosis_late")]),
    ],
    choices: go("WAIT_001"),
  },
  TEST_GENETIC_01: {
    id: "TEST_GENETIC_01",
    blocks: [s("포르피린증 유전자검사\n결과까지 수일"), thought("reasoning", "맞는 검사가\n항상 지금 필요한 검사는 아니다.")],
    onEnter: [test(HARIN, "porphyria_genetic", "ordered")],
    choices: go("TEST_PORPH_01", "급성기 검사를 다시 고른다"),
  },
  TEST_TOTALPOR_01: {
    id: "TEST_TOTALPOR_01",
    blocks: [thought("mechanism", "힌트는 줄 수 있다.\n\n하지만 지금 원하는 질문은\n더 구체적이다.")],
    onEnter: [test(HARIN, "total_urine_porphyrins", "ordered")],
    choices: go("TEST_PORPH_01", "더 구체적인 검사를 고른다"),
  },
};

/** Kept for tests that pin the late-diagnosis boundary. */
export const chapter01DiagnosisTiming = { LATE_DIAGNOSIS_AT } as const;

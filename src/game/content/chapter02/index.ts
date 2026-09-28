import type { ArchiveDefinition, ChapterDefinition, OutcomeRules, VisualAssetDefinition } from "@/game/types";
import { PLAYER, at } from "../shared/helpers";
import { assembleNodeSources } from "../shared/validation";
import { chapter02Clues, chapter02Diagnoses, chapter02Tests } from "./caseData";
import { fieldNodes } from "./field";
import { HYEJIN, SIWOO } from "./helpers";
import { openingNodes } from "./opening";
import { resolutionNodes } from "./resolution";
import { turnNodes } from "./turn";

/**
 * Chapter 2 has no photography yet. Every slot is declared so scenes stage the
 * art-directed backdrops now and pick up real WebP files once they are imported
 * (see docs/VISUAL_BIBLE.md for the shot list).
 */
const missing = (id: string, definition: Omit<VisualAssetDefinition, "id" | "src" | "status">): VisualAssetDefinition =>
  ({ id, src: `assets/chapter02/${id}.webp`, status: "missing", ...definition });

export const chapter02VisualAssets: Record<string, VisualAssetDefinition> = {
  SCN2_001_PEDS_ER: missing("SCN2_001_PEDS_ER", { kind: "scene", aspectRatio: "16:9", alt: "아침의 소아응급실 병상에 누운 아홉 살 시우와 관자놀이를 누르는 엄마", fallback: { backdrop: "er" } }),
  SCN2_002_SEMIBASEMENT: missing("SCN2_002_SEMIBASEMENT", { kind: "scene", aspectRatio: "16:9", alt: "침수 흔적이 무릎 높이에 남은 반지하 원룸과 높은 창", fallback: { backdrop: "semibasement" } }),
  SCN2_003_CHAMBER: missing("SCN2_003_CHAMBER", { kind: "scene", aspectRatio: "16:9", alt: "둥근 창이 달린 일인용 고압산소 챔버", fallback: { backdrop: "icu" } }),
  SCN2_004_WARD: missing("SCN2_004_WARD", { kind: "scene", aspectRatio: "16:9", alt: "오후 햇빛이 드는 소아병동 병실", fallback: { backdrop: "ward" } }),
  EVD2_001_FLUE: missing("EVD2_001_FLUE", {
    kind: "evidence", aspectRatio: "4:3", alt: "이음새가 빠져 기울어진 보일러 배기통과 그을음",
    overlay: { fields: [{ label: "배기통 이음새", value: "이탈" }, { label: "이음새 주위", value: "그을음" }, { label: "CO · 보일러실 입구", value: "212 ppm" }] },
  }),
  EVD2_002_TAPED_WINDOW: missing("EVD2_002_TAPED_WINDOW", { kind: "evidence", aspectRatio: "4:3", alt: "청테이프로 틈을 막은 반지하 창문", overlay: { lines: ["창문 세 곳 · 청테이프 두 겹"] } }),
  EVD2_003_CAGE: missing("EVD2_003_CAGE", { kind: "evidence", aspectRatio: "4:3", alt: "보일러실 문 앞 바닥에 놓인 햄스터 케이지", overlay: { lines: ["보일러실 문에서 한 걸음", "바닥에서 한 뼘 높이"] } }),
};

export const chapter02ArchiveDefinition: ArchiveDefinition = {
  caseId: "CASE 02",
  title: "창문을 닫은 방",
  finalDiagnosis: "일산화탄소 중독 / Carbon Monoxide Poisoning",
  biochemicalDiagnosis: "COHb 23% (아이) · 28% (보호자), 두 사람 모두 비흡연자",
  subtypeConfirmation: "보일러 배기통 이탈 (가스안전공사 확인)",
  complications: ["의식 소실 (보호자)", "심근 손상 (보호자)", "지연성 신경학적 후유증 위험 (아이)"],
  labels: { biochemicalDiagnosis: "혈중 확인", subtypeConfirmation: "노출원" },
  firstHypothesis: {
    valueKey: "initial_anchor",
    labels: { gastroenteritis: "감염성 장염", neurologic: "중추신경계 감염", toxic: "약물 · 독성", metabolic: "대사 이상", environmental: "환경 노출" },
  },
};

export const chapter02Outcomes: OutcomeRules = {
  patientId: HYEJIN,
  triggers: [
    { flag: "flue_found", label: "보일러 배기통 이탈" },
    { flag: "ventilation_known", label: "밀폐된 방 · 환기 차단" },
  ],
  relationship: { brokenBelow: 20, trustedAt: 60, boundaryFlag: "reported_without_consent", repairFlag: "apology_given" },
  severeDelayFlag: "treatment_delay_significant",
  transferFlag: "follow_up_lost",
  outcomeText: {
    END_A: "두 사람 회복 · 새 집으로 이주",
    END_B: "아이 지연성 신경학적 후유증 · 인지 재활",
    END_C: "회복 · 추적 관찰 중단",
    END_D: "회복 · 노출원 미확인으로 이웃 재노출",
    END_E: "귀가 후 재노출 · 다른 병원에서 진단",
  },
  followUpText: { trusted: "보호자 메시지와 외래 추적", guarded: "외래 기록으로 추적", broken: "추적 관찰 중단" },
};

export const chapter02: ChapterDefinition = {
  id: "chapter-02",
  number: 2,
  title: "CHAPTER 2 — 창문을 닫은 방",
  subtitle: "창문을 닫은 방",
  synopsis: "장마가 끝난 지 사흘. 반지하에서 온 아홉 살 아이는 열도 없이 처져 있다. 산소포화도 99%. 어제는 장염이라고 했다.",
  cover: { assetId: "SCN2_002_SEMIBASEMENT", backdrop: "semibasement" },
  startNodeId: "PR_001",
  initial: {
    time: at(6, 40),
    patients: {
      [SIWOO]: { id: SIWOO, name: "박시우", trust: 50, diseaseStage: "early", clues: [], diagnoses: [], tests: {} },
      [HYEJIN]: { id: HYEJIN, name: "정혜진", trust: 35, diseaseStage: "early", clues: [], diagnoses: [], tests: {} },
    },
    flags: {
      caregiver_symptoms_known: false, home_heating_known: false, ventilation_known: false, hamster_known: false,
      cohb_ordered: false, o2_early: false, flue_found: false, reported_without_consent: false, apology_given: false,
    },
  },
  nodes: assembleNodeSources(openingNodes, turnNodes, fieldNodes, resolutionNodes),
  visualAssets: chapter02VisualAssets,
  characters: {
    [PLAYER]: { name: PLAYER, role: "진단팀", tone: "ink", isPlayer: true },
    박시우: { name: "박시우", role: "환자 · 9세", tone: "amber" },
    정혜진: { name: "정혜진", role: "시우의 엄마 · 물류센터 야간조", tone: "rose" },
    서지안: { name: "서지안", role: "소아응급 전공의", tone: "moss" },
    강수진: { name: "강수진", role: "응급실 간호사", tone: "teal" },
    소방대원: { name: "소방대원", tone: "slate" },
    오말순: { name: "오말순", role: "1층 주민", tone: "clay" },
    이다은: { name: "이다은", role: "지역아동센터 교사", tone: "slate" },
    문경희: { name: "문경희", role: "의료사회복지사", tone: "slate" },
  },
  outcomes: chapter02Outcomes,
  completion: {
    caseId: "chapter-02",
    memory: { id: "patient_is_never_one", title: "환자는 한 명이 아니다", description: "같은 공기를 마신 사람은 같은 병을 앓는다. 증상이 한 집에 모여 있으면, 원인도 그 집에 있다.", sourceChapter: "chapter-02" },
    archive: chapter02ArchiveDefinition,
    nodeId: "CASE_COMPLETE",
  },
  clueDefinitions: chapter02Clues,
  diagnosisDefinitions: chapter02Diagnoses,
  testDefinitions: chapter02Tests,
};

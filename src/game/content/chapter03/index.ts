import type { ArchiveDefinition, ChapterDefinition, OutcomeRules, VisualAssetDefinition } from "@/game/types";
import { PLAYER, at } from "../shared/helpers";
import { assembleNodeSources } from "../shared/validation";
import { chapter03Clues, chapter03Diagnoses, chapter03Tests } from "./caseData";
import { fieldNodes } from "./field";
import { SUNRYE } from "./helpers";
import { nightNodes } from "./night";
import { openingNodes } from "./opening";
import { resolutionNodes } from "./resolution";

/** Declared photography slots, staged with backdrops and written notes until imported. */
const missing = (id: string, definition: Omit<VisualAssetDefinition, "id" | "src" | "status">): VisualAssetDefinition =>
  ({ id, src: `assets/chapter03/${id}.webp`, status: "missing", ...definition });
const phonePhoto = { label: "추석 사진" } as const;

export const chapter03VisualAssets: Record<string, VisualAssetDefinition> = {
  SCN3_001_ER_NIGHT: missing("SCN3_001_ER_NIGHT", { kind: "scene", aspectRatio: "16:9", alt: "밤의 응급실 11번 병상, 이불을 턱까지 올린 할머니와 곁의 딸", fallback: { backdrop: "er-night" } }),
  SCN3_002_ICU_BAY: missing("SCN3_002_ICU_BAY", { kind: "scene", aspectRatio: "16:9", alt: "새벽 중환자실 병상, 고유량 산소와 펼쳐진 삽관 준비물", fallback: { backdrop: "icu" } }),
  SCN3_003_WARD_MORNING: missing("SCN3_003_WARD_MORNING", { kind: "scene", aspectRatio: "16:9", alt: "아침 햇빛이 드는 감염내과 병실", fallback: { backdrop: "ward" } }),
  EVD3_001_ESCHAR: missing("EVD3_001_ESCHAR", {
    kind: "evidence", aspectRatio: "4:3", alt: "속옷 선 아래에서 찾은 검은 가피",
    overlay: { fields: [{ label: "위치", value: "왼쪽 가슴 아래 · 속옷 선" }, { label: "크기", value: "8 mm" }, { label: "모양", value: "검은 딱지 · 둘레 홍반" }, { label: "통증 · 가려움", value: "없음" }] },
    fallback: { label: "진찰 기록" },
  }),
  EVD3_002_GRAVE_PHOTO: missing("EVD3_002_GRAVE_PHOTO", { kind: "evidence", aspectRatio: "4:3", alt: "벌초를 마친 봉분 앞 잔디에 나란히 앉은 두 할머니", overlay: { lines: ["추석 사흘 전 · 상월리 뒷산", "반팔 · 맨손 · 돗자리 없음"] }, fallback: phonePhoto }),
  EVD3_003_DOG_PHOTO: missing("EVD3_003_DOG_PHOTO", { kind: "evidence", aspectRatio: "4:3", alt: "귀 안쪽에 진드기가 붙은 누렁이", overlay: { lines: ["영자네 누렁이 · 귀 안쪽 참진드기"] }, fallback: phonePhoto }),
  EVD3_004_PADDY_PHOTO: missing("EVD3_004_PADDY_PHOTO", { kind: "evidence", aspectRatio: "4:3", alt: "비 그친 뒤 물꼬를 트는 논", overlay: { lines: ["비 그친 다음 날 · 장화 없이 물꼬"] }, fallback: phonePhoto }),
  EVD3_005_STORE_PHOTO: missing("EVD3_005_STORE_PHOTO", { kind: "evidence", aspectRatio: "4:3", alt: "가마니 옆에 쥐똥이 흩어진 창고", overlay: { lines: ["창고 · 가마니 옆 쥐 흔적"] }, fallback: phonePhoto }),
};

export const chapter03ArchiveDefinition: ArchiveDefinition = {
  caseId: "CASE 03",
  title: "아무도 보지 않은 곳",
  finalDiagnosis: "쯔쯔가무시병 / Scrub Typhus (Orientia tsutsugamushi)",
  biochemicalDiagnosis: "가피 PCR 양성 · IFA 항체 4배 이상 상승",
  subtypeConfirmation: "추석 벌초 중 털진드기 유충 노출 · 왼쪽 가슴 아래 가피",
  complications: ["간질성 폐렴 · 저산소", "혈소판 감소", "간염", "의식 저하"],
  labels: { biochemicalDiagnosis: "병원체 확인", subtypeConfirmation: "노출 경로" },
  firstHypothesis: {
    valueKey: "initial_anchor",
    labels: { urosepsis: "요로감염 · 패혈증", drug: "약물 반응", viral: "바이러스 감염", vector: "진드기 · 풀숲 매개 감염", pneumonia: "폐렴" },
  },
};

export const chapter03Outcomes: OutcomeRules = {
  patientId: SUNRYE,
  triggers: [
    { flag: "grass_exposure_known", label: "추석 벌초 · 풀밭에 앉음" },
    { flag: "neighbor_warned", label: "함께 벌초한 이웃 · 두 번째 환자" },
  ],
  relationship: { brokenBelow: 20, trustedAt: 60, boundaryFlag: "dignity_breached", repairFlag: "dignity_apology" },
  severeDelayFlag: "treatment_delay_significant",
  transferFlag: "follow_up_lost",
  outcomeText: {
    END_A: "해열 36시간 · 후유증 없이 귀향",
    END_B: "중환자실 치료 · 보행 재활",
    END_C: "회복 · 외래 전원",
    END_D: "회복 · 노출 경로 추적 중단",
    END_E: "중환자실에서 뒤늦게 진단 · 기관삽관",
  },
  followUpText: { trusted: "딸의 메시지와 외래 추적", guarded: "외래 기록으로 추적", broken: "읍내 병원으로 외래 전원" },
};

export const chapter03: ChapterDefinition = {
  id: "chapter-03",
  number: 3,
  title: "CHAPTER 3 — 아무도 보지 않은 곳",
  subtitle: "아무도 보지 않은 곳",
  synopsis: "추석이 지나고 열흘. 엿새째 열이 나는 일흔여섯 할머니. 소변에 백혈구, 동네 의원 항생제는 듣지 않는다. 모두가 요로감염이라고 한다.",
  cover: { backdrop: "village" },
  startNodeId: "PR_001",
  initial: {
    time: at(20, 50),
    patients: { [SUNRYE]: { id: SUNRYE, name: "문순례", trust: 45, diseaseStage: "progressing", clues: [], diagnoses: [], tests: {} } },
    flags: {
      grass_exposure_known: false, bite_site_known: false, eschar_found: false, early_doxy: false,
      dignity_breached: false, dignity_apology: false, neighbor_warned: false,
    },
  },
  nodes: assembleNodeSources(openingNodes, nightNodes, fieldNodes, resolutionNodes),
  visualAssets: chapter03VisualAssets,
  characters: {
    [PLAYER]: { name: PLAYER, role: "진단팀", tone: "ink", isPlayer: true },
    문순례: { name: "문순례", role: "환자 · 76세", tone: "clay" },
    이수경: { name: "이수경", role: "순례의 딸", tone: "rose" },
    서지안: { name: "서지안", role: "응급의학과 전공의", tone: "moss" },
    강수진: { name: "강수진", role: "응급실 간호사", tone: "teal" },
    윤재혁: { name: "윤재혁", role: "중환자실 전임의", tone: "slate" },
    박영자: { name: "박영자", role: "상월리 · 순례의 이웃", tone: "amber" },
    황보성: { name: "황보성", role: "읍내 의원 원장", tone: "slate" },
  },
  outcomes: chapter03Outcomes,
  completion: {
    caseId: "chapter-03",
    memory: { id: "unseen_is_not_absent", title: "보지 않은 곳은 없는 곳이 아니다", description: "진찰은 환자가 보여준 곳에서 끝나지 않는다. 옷 속, 피부 주름, 말하지 않은 여행. 먼저 묻고, 끝까지 본다.", sourceChapter: "chapter-03" },
    archive: chapter03ArchiveDefinition,
    nodeId: "CASE_COMPLETE",
  },
  clueDefinitions: chapter03Clues,
  diagnosisDefinitions: chapter03Diagnoses,
  testDefinitions: chapter03Tests,
};

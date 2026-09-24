import type { VisualAssetDefinition } from "@/game/types";

const chapterAsset = (id: string) => `assets/chapter01/${id}.webp`;
const hospital = { continuityGroup: "ER_07" } as const;

export const CHAPTER01_GAME_ASSET_IDS = [
  "CIN_001_REHEARSAL", "CIN_002_COLLAPSE", "SCN_001_ER_INITIAL", "SCN_002_ER_WEAKNESS",
  "EVD_001_URINE", "SCN_003_APARTMENT", "EVD_002_FRIDGE", "EVD_003_WEIGHT_NOTEBOOK",
  "EVD_004_OCP", "SCN_004_REHEARSAL_EMPTY", "EVD_005_WATER_BOTTLE",
  "SCN_005_ER_DETERIORATION", "SCN_006_TREATMENT", "SCN_007_RECOVERY",
] as const;

const asset = (id: string, definition: Omit<VisualAssetDefinition, "id" | "src">): VisualAssetDefinition =>
  ({ id, src: chapterAsset(id), ...definition });

export const chapter01VisualAssets: Record<string, VisualAssetDefinition> = {
  CHR_HARIN_MASTER_01: asset("CHR_HARIN_MASTER_01", { kind: "scene", aspectRatio: "4:3", alt: "윤하린 캐릭터 제작 기준 이미지", referenceOnly: true }),
  CIN_001_REHEARSAL: asset("CIN_001_REHEARSAL", { kind: "cinematic", aspectRatio: "9:16", alt: "공연을 앞두고 군무를 반복하는 밤의 연습실", focalPoint: { x: 50, y: 32 } }),
  CIN_002_COLLAPSE: asset("CIN_002_COLLAPSE", { kind: "cinematic", aspectRatio: "9:16", alt: "리허설 도중 무릎이 꺾인 윤하린", focalPoint: { x: 52, y: 45 } }),
  SCN_001_ER_INITIAL: asset("SCN_001_ER_INITIAL", { kind: "scene", aspectRatio: "16:9", alt: "응급실 07 병상에 도착한 윤하린", ...hospital }),
  SCN_002_ER_WEAKNESS: asset("SCN_002_ER_WEAKNESS", { kind: "scene", aspectRatio: "16:9", alt: "응급실 병상에서 다리 근력을 확인하는 장면", ...hospital }),
  EVD_001_URINE: asset("EVD_001_URINE", { kind: "evidence", aspectRatio: "4:3", alt: "간호 스테이션에 놓인 소변 검체" }),
  SCN_003_APARTMENT: asset("SCN_003_APARTMENT", { kind: "scene", aspectRatio: "16:9", alt: "정돈됐지만 생활 흔적이 남은 윤하린의 원룸" }),
  EVD_002_FRIDGE: asset("EVD_002_FRIDGE", { kind: "evidence", aspectRatio: "4:3", alt: "식사 재료가 거의 없는 냉장고 내부" }),
  EVD_003_WEIGHT_NOTEBOOK: asset("EVD_003_WEIGHT_NOTEBOOK", { kind: "evidence", aspectRatio: "4:3", alt: "체중 변화가 기록된 수첩", overlay: { fields: [{ label: "D-10", value: "51.2" }, { label: "D-8", value: "50.4" }, { label: "D-5", value: "49.8" }, { label: "D-3", value: "49.1" }] } }),
  EVD_004_OCP: asset("EVD_004_OCP", { kind: "evidence", aspectRatio: "4:3", alt: "화장대 위에 놓인 작은 약 포장", overlay: { lines: ["최근 시작한 경구피임약 포장"] } }),
  SCN_004_REHEARSAL_EMPTY: asset("SCN_004_REHEARSAL_EMPTY", { kind: "scene", aspectRatio: "16:9", alt: "밤의 텅 빈 연습실" }),
  EVD_005_WATER_BOTTLE: asset("EVD_005_WATER_BOTTLE", { kind: "evidence", aspectRatio: "4:3", alt: "연습실 바닥에 놓인 물병" }),
  SCN_005_ER_DETERIORATION: asset("SCN_005_ER_DETERIORATION", { kind: "scene", aspectRatio: "16:9", alt: "신경학적 증상이 악화된 응급실의 윤하린", ...hospital }),
  SCN_006_TREATMENT: asset("SCN_006_TREATMENT", { kind: "scene", aspectRatio: "16:9", alt: "응급실 병상에서 헤민 치료를 준비하는 의료진", ...hospital }),
  SCN_007_RECOVERY: asset("SCN_007_RECOVERY", { kind: "scene", aspectRatio: "16:9", alt: "회복하며 병원 식사를 드는 윤하린", ...hospital }),
};

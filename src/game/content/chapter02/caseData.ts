import type { ClueDefinition, DiagnosisDefinition, DiagnosisRule, TestDefinition } from "@/game/types";

const clue = (id: string, title: string, category: ClueDefinition["category"], description?: string): ClueDefinition => ({ id, title, category, description });

export const chapter02Clues: Record<string, ClueDefinition> = Object.fromEntries([
  clue("vomiting_child", "반복 구토 (아이)", "clinical"),
  clue("headache_child", "두통 (아이)", "clinical"),
  clue("confusion_child", "느린 대답 · 혼돈", "clinical"),
  clue("ataxia_child", "보행 실조", "clinical", "두 번째 걸음에서 벽을 짚는다."),
  clue("soft_abdomen_child", "부드러운 배 · 압통 없음", "clinical"),
  clue("no_meningism", "경부강직 없음", "clinical"),
  clue("afebrile_both", "두 사람 모두 발열 없음", "clinical"),
  clue("caregiver_headache", "보호자 두통 · 오심 (사흘째)", "clinical", "같은 집에서 지낸 사람의 같은 증상."),
  clue("caregiver_syncope", "보호자 실신", "clinical"),
  clue("chest_tightness", "보호자 흉부 답답함", "clinical"),
  clue("normal_spo2", "SpO2 99% · 98%", "lab", "맥박산소측정기는 산소와 일산화탄소를 구별하지 못한다."),
  clue("normal_labs", "혈당 · 전해질 · CRP 정상", "lab"),
  clue("normal_ct", "뇌 CT 정상", "lab"),
  clue("normal_csf", "뇌척수액 정상", "lab"),
  clue("tox_negative", "약물 선별검사 음성", "lab"),
  clue("cohb_elevated", "COHb 23% · 28%", "lab", "비흡연자 정상은 3% 미만."),
  clue("troponin_mild", "보호자 트로포닌 경도 상승", "lab"),
  clue("morning_worse", "아침에 심하고 낮에는 나아짐", "history"),
  clue("loose_stool", "어제 묽은 변 한 번", "history"),
  clue("sleeping_pills", "보호자 수면제 복용", "history", "야간 근무 뒤 낮잠을 위해."),
  clue("child_alone_nights", "야간 근무 중 아이 혼자 취침", "history"),
  clue("flooded_home", "사흘 전 침수된 반지하", "environment"),
  clue("boiler_running", "보일러 연속 가동", "environment", "장판을 말리려고 사흘째."),
  clue("windows_closed", "창문 밀폐", "environment", "하수구 냄새 때문에 테이프로 막았다."),
  clue("dead_pet", "햄스터 폐사", "environment", "케이지는 보일러실 옆 바닥에 있었다."),
  clue("flue_dislodged", "보일러 배기통 이탈", "environment", "이음새 주위로 그을음."),
  clue("old_inspection", "마지막 보일러 점검 2019년", "environment"),
  clue("neighbor_symptoms", "윗집 주민도 두통", "environment"),
].map((item) => [item.id, item]));

const rule = (text: string, clueId?: string): DiagnosisRule => ({ text, conditions: clueId ? [{ type: "clue", clueId }] : undefined });
const unless = (text: string, clueId: string): DiagnosisRule => ({ text, conditions: [{ type: "clue", clueId, present: false }] });

export const chapter02Diagnoses: Record<string, DiagnosisDefinition> = Object.fromEntries(([
  {
    id: "infectious_gastroenteritis", nameKo: "감염성 장염", nameEn: "Infectious gastroenteritis",
    supportRules: [rule("반복 구토", "vomiting_child"), rule("어제 묽은 변", "loose_stool"), rule("침수 오염수 노출", "flooded_home")],
    contradictionRules: [rule("배가 조용하고 압통이 없다", "soft_abdomen_child"), rule("탈수에 비해 의식 변화가 크다", "confusion_child"), rule("보호자의 실신을 설명하지 못한다", "caregiver_syncope")],
    unknownRules: [rule("대변 검사")],
  },
  {
    id: "meningoencephalitis", nameKo: "뇌수막염 · 뇌염", nameEn: "Meningoencephalitis",
    supportRules: [rule("두통과 구토", "headache_child"), rule("혼돈", "confusion_child")],
    contradictionRules: [rule("열이 없다", "afebrile_both"), rule("경부강직이 없다", "no_meningism"), rule("뇌척수액이 정상", "normal_csf"), rule("보호자도 같은 증상", "caregiver_headache")],
    unknownRules: [unless("뇌척수액 검사", "normal_csf")],
  },
  {
    id: "co_poisoning", nameKo: "일산화탄소 중독", nameEn: "Carbon monoxide poisoning",
    supportRules: [
      rule("같은 집 보호자의 같은 증상", "caregiver_headache"), rule("밀폐된 방에서의 연소", "boiler_running"), rule("환기 차단", "windows_closed"),
      rule("열 없는 두통 · 구토 · 혼돈", "afebrile_both"), rule("작은 동물이 먼저 쓰러졌다", "dead_pet"), rule("집을 떠나면 나아진다", "morning_worse"),
      rule("정상 SpO2는 CO를 배제하지 못한다", "normal_spo2"), rule("COHb 상승", "cohb_elevated"),
    ],
    contradictionRules: [],
    unknownRules: [unless("COHb (co-oximetry)", "cohb_elevated"), unless("노출원", "flue_dislodged")],
  },
  {
    id: "ingestion", nameKo: "약물 · 독성물질 섭취", nameEn: "Toxic ingestion",
    supportRules: [rule("설명되지 않는 혼돈", "confusion_child"), rule("집에 수면제가 있다", "sleeping_pills")],
    contradictionRules: [rule("보호자까지 설명하지 못한다", "caregiver_syncope"), rule("약물 선별검사 음성", "tox_negative")],
    unknownRules: [unless("약물 선별검사", "tox_negative")],
  },
  {
    id: "stress_and_gastroenteritis", nameKo: "보호자 과로성 실신 · 아이 장염", nameEn: "Two unrelated illnesses",
    supportRules: [rule("야간 근무와 수면 부족"), rule("어제의 장염 진단", "loose_stool")],
    contradictionRules: [rule("같은 날 아침, 같은 방의 두 사람", "caregiver_syncope"), rule("둘 다 열이 없다", "afebrile_both")],
    unknownRules: [],
  },
  {
    id: "metabolic", nameKo: "저혈당 · 대사 이상", nameEn: "Metabolic",
    supportRules: [rule("구토와 처짐", "vomiting_child")],
    contradictionRules: [rule("혈당과 전해질이 정상", "normal_labs")],
    unknownRules: [],
  },
] satisfies DiagnosisDefinition[]).map((item) => [item.id, item]));

export const chapter02Tests: Record<string, TestDefinition> = Object.fromEntries([
  { id: "vbg_cohb", nameKo: "정맥혈가스 · COHb", nameEn: "Co-oximetry" },
  { id: "head_ct", nameKo: "뇌 CT", nameEn: "Head CT" },
  { id: "lumbar_puncture", nameKo: "요추천자 · 뇌척수액", nameEn: "CSF analysis" },
  { id: "tox_screen", nameKo: "소변 약물 선별검사", nameEn: "Urine drug screen" },
  { id: "troponin", nameKo: "트로포닌 I", nameEn: "Troponin I" },
  { id: "bhcg", nameKo: "β-hCG", nameEn: "Pregnancy test" },
  { id: "neurocog", nameKo: "신경인지 선별검사", nameEn: "Neurocognitive screen" },
].map((item) => [item.id, item]));

import type { ClueDefinition, DiagnosisDefinition, TestDefinition } from "@/game/types";

const clue = (id: string, title: string, category: ClueDefinition["category"], description?: string): ClueDefinition => ({ id, title, category, description });
export const chapter01Clues: Record<string, ClueDefinition> = Object.fromEntries([
  clue("diffuse_severe_abdominal_pain", "심한 비국소성 복통", "clinical"), clue("constipation", "변비", "clinical"), clue("vomiting", "구토", "clinical"),
  clue("soft_abdomen", "부드러운 복부", "clinical"), clue("no_peritoneal_sign", "복막자극징후 없음", "clinical"), clue("pain_exam_discordance", "통증과 진찰 소견의 불일치", "clinical"),
  clue("tachycardia", "빈맥", "clinical"), clue("hypertension", "고혈압", "clinical"), clue("afebrile", "발열 없음", "clinical"),
  clue("hyponatremia_initial", "Na 128", "lab"), clue("progressive_hyponatremia", "진행성 저나트륨혈증", "lab"), clue("siadh_pattern", "SIADH 양상", "lab"), clue("previous_Na133", "과거 Na 133", "lab"),
  clue("previous_attacks", "반복된 과거 발작", "history"), clue("severe_caloric_restriction", "심한 식사 제한", "history"), clue("recent_hormonal_medication", "최근 시작한 호르몬제", "history"),
  clue("preexisting_motor_weakness", "복통 전부터 있었던 근력저하", "history"), clue("maternal_family_recurrent_neurovisceral_attacks", "모계 가족의 반복성 신경내장 증상", "history"), clue("severe_sleep_deprivation", "심한 수면 부족", "history"),
  clue("rapid_weight_loss", "최근의 빠른 체중 감소", "history"), clue("proximal_weakness", "근위부 근력저하", "clinical"), clue("progressive_motor_neuropathy", "진행성 운동신경병증", "clinical"),
  clue("fine_tremor", "미세 떨림", "clinical"), clue("autonomic_instability", "자율신경 불안정", "clinical"), clue("perceptual_disturbance", "지각 변화", "clinical"), clue("worsening_neuropsychiatric_symptoms", "진행하는 신경정신 증상", "clinical"),
].map(item => [item.id, item]));

const rule = (text: string, clueId?: string) => ({ text, conditions: clueId ? [{ type: "clue" as const, clueId }] : undefined });
export const chapter01Diagnoses: Record<string, DiagnosisDefinition> = Object.fromEntries(([
  { id: "acute_abdominal_pathology", nameKo: "급성 복부 질환", nameEn: "Acute abdominal pathology", supportRules: [rule("심한 복통", "diffuse_severe_abdominal_pain")], contradictionRules: [rule("복막자극징후가 없음", "no_peritoneal_sign"), rule("CT에서 구조적 원인이 확인되지 않음")], unknownRules: [rule("비구조적 원인 검토 필요")] },
  { id: "lead_poisoning", nameKo: "납중독", nameEn: "Lead poisoning", supportRules: [rule("복통과 변비", "constipation"), rule("운동신경 증상", "progressive_motor_neuropathy")], contradictionRules: [{ text: "혈중 납이 진단적 수준이 아님", conditions: [{ type: "test", testId: "blood_lead", status: "negative" }] }], unknownRules: [rule("혈중 납 결과")] },
  { id: "guillain_barre", nameKo: "길랭-바레증후군", nameEn: "Guillain–Barré syndrome", supportRules: [rule("진행성 운동신경 약화", "progressive_motor_neuropathy")], contradictionRules: [rule("신경병증보다 심한 복통이 먼저 시작됨", "diffuse_severe_abdominal_pain"), rule("고혈압과 내장 증상을 충분히 묶지 못함", "autonomic_instability")], unknownRules: [rule("신경학적 경과")] },
  { id: "pheochromocytoma", nameKo: "갈색세포종", nameEn: "Pheochromocytoma", supportRules: [rule("고혈압과 빈맥", "hypertension")], contradictionRules: [rule("운동신경 약화와 변비를 충분히 설명하지 못함")], unknownRules: [rule("생화학 검사")] },
  { id: "toxic_drug", nameKo: "약물·독성 원인", nameEn: "Toxic / drug-related", supportRules: [rule("최근 호르몬제", "recent_hormonal_medication")], contradictionRules: [], unknownRules: [rule("추가 노출력")] },
  { id: "functional_psychiatric", nameKo: "기능성·정신과적 원인", nameEn: "Functional / psychiatric", supportRules: [rule("과거 불안 관련 평가", "previous_attacks")], contradictionRules: [rule("진행성 저나트륨혈증", "progressive_hyponatremia"), rule("객관적인 운동신경 약화", "progressive_motor_neuropathy")], unknownRules: [] },
  { id: "acute_hepatic_porphyria", nameKo: "급성 간성 포르피린증", nameEn: "Acute hepatic porphyria", supportRules: [rule("심한 비국소성 복통", "diffuse_severe_abdominal_pain"), rule("변비", "constipation"), rule("진행성 저나트륨혈증", "progressive_hyponatremia"), rule("자율신경 불안정", "autonomic_instability"), rule("운동신경 약화", "progressive_motor_neuropathy"), rule("반복 발작", "previous_attacks"), rule("촉발 요인", "severe_caloric_restriction")], contradictionRules: [], unknownRules: [{ text: "PBG / ALA 결과", conditions: [{ type: "test", testId: "urine_pbg_ala", status: "pending" }] }] },
] satisfies DiagnosisDefinition[]).map(item => [item.id, item]));

export const chapter01Tests: Record<string, TestDefinition> = Object.fromEntries([
  { id: "blood_lead", nameKo: "혈중 납", nameEn: "Blood lead level" }, { id: "urine_pbg_ala", nameKo: "소변 PBG / ALA", nameEn: "Urine PBG / ALA" },
  { id: "porphyria_genetic", nameKo: "포르피린증 유전자검사", nameEn: "Porphyria genetic panel" }, { id: "total_urine_porphyrins", nameKo: "총 소변 포르피린", nameEn: "Total urine porphyrins" },
  { id: "hmbs_variant", nameKo: "HMBS 변이", nameEn: "HMBS variant" },
].map(item => [item.id, item]));

import type { ClueDefinition, DiagnosisDefinition, DiagnosisRule, TestDefinition } from "@/game/types";

const clue = (id: string, title: string, category: ClueDefinition["category"], description?: string): ClueDefinition => ({ id, title, category, description });

export const chapter03Clues: Record<string, ClueDefinition> = Object.fromEntries([
  clue("fever_6days", "엿새째 고열", "clinical"),
  clue("headache_myalgia", "두통 · 온몸 근육통", "clinical"),
  clue("trunk_rash", "몸통에서 번진 반점구진 발진", "clinical", "가렵지 않다."),
  clue("conjunctival_injection", "결막 충혈", "clinical"),
  clue("lymphadenopathy", "겨드랑이 림프절 비대", "clinical"),
  clue("confusion_elderly", "지남력 저하", "clinical"),
  clue("hypoxemia", "저산소 · SpO2 93%", "clinical"),
  clue("shock_signs", "혈압 저하 · 의식 악화", "clinical"),
  clue("eschar", "가피 · 왼쪽 가슴 아래", "clinical", "지름 8밀리미터, 둘레가 붉은 검은 딱지. 속옷 선 아래."),
  clue("thrombocytopenia", "혈소판 86,000", "lab"),
  clue("elevated_liver_enzymes", "AST 148 · ALT 121", "lab"),
  clue("pyuria_nitrite_negative", "소변 백혈구 · 아질산염 음성", "lab", "열이 나면 소변 백혈구는 흔히 늘어난다."),
  clue("no_eosinophilia", "호산구 1% · 증가 없음", "lab"),
  clue("no_proteinuria", "단백뇨 없음 · 크레아티닌 1.2", "lab"),
  clue("interstitial_cxr", "흉부 사진 · 양측 간질성 음영", "lab"),
  clue("rdt_negative_early", "쯔쯔가무시 신속항체 음성 (발병 6일)", "lab", "항체는 보통 발병 일주일 무렵부터 오른다."),
  clue("sfts_negative", "SFTS 유전자검사 음성", "lab"),
  clue("eschar_pcr_positive", "가피 PCR · Orientia tsutsugamushi 양성", "lab"),
  clue("cephalosporin_failure", "세픽심 사흘 · 반응 없음", "history"),
  clue("new_allopurinol", "3주 전 시작한 알로퓨리놀", "history"),
  clue("beolcho", "추석 벌초 · 풀밭에 앉음", "history", "긴 소매도, 돗자리도 없이."),
  clue("rice_paddy", "비 온 뒤 논일", "history"),
  clue("storehouse_mice", "창고의 쥐 흔적", "environment"),
  clue("dog_ticks", "이웃 개의 진드기", "environment"),
  clue("neighbor_fever", "함께 벌초한 이웃도 발열", "environment"),
].map((item) => [item.id, item]));

const rule = (text: string, clueId?: string): DiagnosisRule => ({ text, conditions: clueId ? [{ type: "clue", clueId }] : undefined });
const unless = (text: string, clueId: string): DiagnosisRule => ({ text, conditions: [{ type: "clue", clueId, present: false }] });

export const chapter03Diagnoses: Record<string, DiagnosisDefinition> = Object.fromEntries(([
  {
    id: "scrub_typhus", nameKo: "쯔쯔가무시병", nameEn: "Scrub typhus (Orientia tsutsugamushi)",
    supportRules: [
      rule("가을 · 벌초 · 풀밭", "beolcho"), rule("고열 · 두통 · 근육통", "headache_myalgia"), rule("몸통의 반점구진 발진", "trunk_rash"),
      rule("림프절 비대", "lymphadenopathy"), rule("혈소판 감소 · 간수치 상승", "thrombocytopenia"), rule("베타락탐 항생제에 반응 없음", "cephalosporin_failure"),
      rule("간질성 폐렴 양상", "interstitial_cxr"), rule("가피", "eschar"), rule("가피 PCR 양성", "eschar_pcr_positive"),
    ],
    contradictionRules: [],
    unknownRules: [rule("초기 항체검사 음성은 배제가 아니다", "rdt_negative_early"), unless("가피 PCR · IFA 항체", "eschar_pcr_positive")],
  },
  {
    id: "leptospirosis", nameKo: "렙토스피라증", nameEn: "Leptospirosis",
    supportRules: [rule("비 온 뒤 논일", "rice_paddy"), rule("결막 충혈", "conjunctival_injection"), rule("간수치 상승", "elevated_liver_enzymes")],
    contradictionRules: [rule("가피는 렙토스피라의 흔적이 아니다", "eschar"), rule("황달이 없다"), rule("장딴지 통증이 없다")],
    unknownRules: [rule("미세응집반응(MAT)")],
  },
  {
    id: "hfrs", nameKo: "신증후군출혈열", nameEn: "Hemorrhagic fever with renal syndrome",
    supportRules: [rule("혈소판 감소", "thrombocytopenia"), rule("창고의 쥐", "storehouse_mice")],
    contradictionRules: [rule("단백뇨가 없고 신장이 버틴다", "no_proteinuria"), rule("가피", "eschar")],
    unknownRules: [rule("한탄바이러스 항체")],
  },
  {
    id: "sfts", nameKo: "중증열성혈소판감소증후군", nameEn: "SFTS",
    supportRules: [rule("혈소판 감소", "thrombocytopenia"), rule("진드기 노출 가능성", "dog_ticks"), rule("간수치 상승", "elevated_liver_enzymes")],
    contradictionRules: [rule("백혈구 감소가 뚜렷하지 않다"), rule("가피는 쯔쯔가무시 쪽이다", "eschar"), rule("유전자검사 음성", "sfts_negative")],
    unknownRules: [unless("SFTS 유전자검사", "sfts_negative")],
  },
  {
    id: "dress", nameKo: "약물 과민반응 (DRESS)", nameEn: "Allopurinol hypersensitivity",
    supportRules: [rule("3주 전 새 약", "new_allopurinol"), rule("발진과 열", "trunk_rash"), rule("림프절 · 간수치", "lymphadenopathy")],
    contradictionRules: [rule("호산구 증가가 없다", "no_eosinophilia"), rule("얼굴 부종이 없다"), rule("가피", "eschar")],
    unknownRules: [rule("호산구 추이 · 피부 조직검사")],
  },
  {
    id: "urosepsis", nameKo: "요로감염 · 요로패혈증", nameEn: "Urosepsis",
    supportRules: [rule("소변 백혈구", "pyuria_nitrite_negative"), rule("노인의 열과 혼돈", "confusion_elderly")],
    contradictionRules: [rule("아질산염 음성", "pyuria_nitrite_negative"), rule("세팔로스포린에 반응 없음", "cephalosporin_failure"), rule("요로감염으로는 발진을 설명 못 함", "trunk_rash")],
    unknownRules: [rule("소변 · 혈액 배양")],
  },
] satisfies DiagnosisDefinition[]).map((item) => [item.id, item]));

export const chapter03Tests: Record<string, TestDefinition> = Object.fromEntries([
  { id: "covid_flu", nameKo: "코로나 · 독감 PCR", nameEn: "SARS-CoV-2 / influenza" },
  { id: "blood_culture", nameKo: "혈액 · 소변 배양", nameEn: "Cultures" },
  { id: "scrub_rdt", nameKo: "쯔쯔가무시 신속항체", nameEn: "Scrub typhus RDT" },
  { id: "sfts_pcr", nameKo: "SFTS 유전자검사", nameEn: "SFTS RT-PCR" },
  { id: "eschar_pcr", nameKo: "가피 PCR", nameEn: "Eschar PCR" },
  { id: "scrub_ifa", nameKo: "쯔쯔가무시 IFA 항체", nameEn: "Indirect immunofluorescence" },
].map((item) => [item.id, item]));

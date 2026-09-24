import type { AbilityName, ChapterDefinition, Condition, Effect, NarrativeBlock, PlayerState, StoryNode } from "@/game/types";

export const defaultPlayer: PlayerState = { name: "당직의", abilities: { observation: 3, history: 2, empathy: 2, mechanism: 2, reasoning: 2, suspicion: 2, decision: 2 } };
const d = (speaker: string, text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "dialogue", speaker, text, conditions });
const p = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "prose", text, conditions });
const s = (text: string, conditions?: Condition[]): NarrativeBlock => ({ type: "system", text, conditions });
const ability = (name: AbilityName, value: number): Condition => ({ type: "ability", ability: name, operator: "gte", value });
const thought = (name: AbilityName, text: string, threshold?: number): NarrativeBlock => ({ type: "thought", ability: name, text, conditions: threshold === undefined ? undefined : [ability(name, threshold)] });
const trust = (operator: "gte" | "lt", value: number): Condition => ({ type: "trust", patientId: "harin", operator, value });
const clue = (clueId: string): Effect => ({ type: "clue", patientId: "harin", clueId });
const done = (name: string): Effect => ({ type: "flag", key: `er002_${name}_complete`, value: true });
const examDone = (name: string): Effect => ({ type: "flag", key: `exam_${name}_complete`, value: true });
const go = (next: string) => [{ id: `continue-${next}`, label: "계속", next }];
const continueTo = go;
const back = (name: string) => [{ id: `return-${name}`, label: "첫 질문 선택으로 돌아간다", next: "ER_002" }];
const examBack = (name: string) => [{ id: `return-${name}`, label: "진찰 선택으로 돌아간다", next: "ER_003" }];
const outcome = (id: string, blocks: NarrativeBlock[], onEnter: Effect[]): StoryNode => ({ id, blocks, onEnter, choices: back("pain") });
const checkOutcome = (id: string, blocks: NarrativeBlock[], trustAmount: number, reveal = false): StoryNode => ({ id, blocks, onEnter: [...(trustAmount ? [{ type: "trust" as const, patientId: "harin", amount: trustAmount }] : []), ...(reveal ? [{ type: "flag" as const, key: "restricted_diet_known", value: true }] : [])], choices: go("ER_010") });
const hubCategories = [["pain", "통증에 대해 묻는다", "ER_PAIN_01"], ["gi", "소화기 증상을 묻는다", "ER_GI_01"], ["med", "약물과 과거력을 확인한다", "ER_MED_01"], ["life", "최근 생활을 묻는다", "ER_LIFE_01"]] as const;
const hubFlags = hubCategories.map(([id]) => `er002_${id}_complete`);
const examCategories = [["abd", "복부 진찰", "EXAM_ABD_01"], ["cv", "심폐/활력 상태를 다시 본다", "EXAM_CV_01"], ["neuro", "신경학적 진찰", "EXAM_NEURO_01"]] as const;
const examFlags = examCategories.map(([id]) => `exam_${id}_complete`);
const anchors = [["acute_abdomen", "급성 복부 질환"], ["toxic_drug", "독성/약물"], ["endocrine_autonomic", "내분비/자율신경"], ["functional_psychiatric", "기능성/정신과적"], ["neurologic", "신경학적"]] as const;
const medGate: Condition = { type: "any", conditions: [{ type: "trust", patientId: "harin", operator: "gte", value: 65 }, { type: "flag", key: "medication_incomplete" }] };

export const hospitalChapter: ChapterDefinition = {
  id: "chapter-01",
  title: "CHAPTER 1 — 아무것도 없는 배",
  startNodeId: "PR_001",
  initial: {
    time: 1182,
    patients: { harin: { id: "harin", name: "윤하린", trust: 40, diseaseStage: "latent", clues: [], diagnoses: [], tests: {} } },
    flags: {
      visited_apartment: false, visited_rehearsal: false, contacted_family: false,
      restricted_diet_known: false, ocp_known: false, family_history_known: false,
      previous_attacks_known: false, early_weakness_known: false, urine_color_known: false,
      aip_available: false, acute_porphyria_suspected: false, pbg_ordered: false,
      pbg_positive: false, hemin_started: false, family_boundary_broken: false,
      patient_apology_given: false,
    },
  },
  nodes: {
    PR_001: { id: "PR_001", presentation: { mode: "immersive", hideTime: true, hideCase: true }, blocks: [
      { type: "prose", text: "완전한 검정." }, { type: "prose", text: "멀리서 피아노 한 음이 들린다." },
      { type: "dialogue", speaker: "무대감독", text: "“다시 갈게요. 47마디부터.”" },
    ], choices: [{ id: "tap", label: "화면 탭", next: "PR_002" }] },
    PR_002: { id: "PR_002", presentation: { mode: "cinematic", hideCase: true, imageKey: "rehearsal" }, blocks: [
      { type: "prose", text: "조명이 켜진다." }, { type: "prose", text: "앙상블 배우들이 빈 객석을 향해 군무를 반복한다." },
      { type: "prose", text: "윤하린은 그중 한 명이다." }, { type: "prose", text: "박자." }, { type: "prose", text: "한 번." },
      { type: "prose", text: "두 번." }, { type: "prose", text: "오른손이 잠깐 배로 내려간다." }, { type: "prose", text: "다시 원래 자세." },
      { type: "thought", label: "◉ 관찰", text: "한 동작이 반 박자 늦었다.", conditions: [{ type: "ability", ability: "observation", operator: "gte", value: 3 }] },
    ], choices: continueTo("PR_003") },
    PR_003: { id: "PR_003", blocks: [
      { type: "dialogue", speaker: "정세영", text: "“괜찮아?”" }, { type: "dialogue", speaker: "윤하린", text: "“응.”" },
      { type: "prose", text: "피아노가 계속된다." }, { type: "prose", text: "하린이 다시 움직인다." },
      { type: "prose", text: "이번에는 두 걸음 만에 멈춘다." }, { type: "prose", text: "숨을 깊게 들이마신다." },
    ], choices: continueTo("PR_004") },
    PR_004: { id: "PR_004", blocks: [
      { type: "prose", text: "하린의 무릎이 꺾인다." }, { type: "prose", text: "무대 바닥." },
      { type: "dialogue", speaker: "세영", text: "“하린아?”" }, { type: "dialogue", speaker: "하린", text: "“잠깐만…”" },
      { type: "dialogue", speaker: "세영", text: "“119 부를게.”" }, { type: "dialogue", speaker: "하린", text: "“아니. 괜찮—”" },
      { type: "prose", text: "말이 끊긴다." }, { type: "prose", text: "하린이 배를 움켜쥔다." }, { type: "dialogue", speaker: "하린", text: "“또 시작됐어.”" },
    ], onEnter: [{ type: "flag", key: "clue_previous_episode_hint", value: true }], choices: continueTo("PR_005") },
    PR_005: { id: "PR_005", presentation: { hideCase: true, timeLabel: "19:42" }, blocks: [
      { type: "prose", text: "암전." }, { type: "system", text: "19:42" }, { type: "prose", text: "전화 진동." },
      { type: "dialogue", speaker: "목소리", text: "“진단팀 맞으시죠?”" }, { type: "dialogue", speaker: "목소리", text: "“28세 여성입니다.”" },
      { type: "dialogue", speaker: "목소리", text: "“복통이 굉장히 심한데… 지금까지 설명이 잘 안 됩니다.”" },
    ], choices: continueTo("PR_006") },
    PR_006: { id: "PR_006", title: "CHAPTER 1\n\n아무것도 없는 배", presentation: { mode: "immersive", hideTime: true, hideCase: true, autoAdvanceMs: 1500 }, blocks: [], autoNext: "ER_001" },
    ER_001: { id: "ER_001", title: "19:55 응급실", presentation: { imageKey: "erInitial", timeLabel: "19:55", location: "응급실 07", clinicalData: [{ label: "HR", value: "118" }, { label: "BP", value: "168/102", tone: "warning" }, { label: "T", value: "36.7" }] }, onEnter: [{ type: "setTime", value: 1195 }, { type: "timeline", entry: { id: "arrival", time: 1195, kind: "clinical", text: "응급실 도착" } }], blocks: [
      { type: "system", text: "HR 118\nBP 168/102\nT 36.7" }, { type: "dialogue", speaker: "강수진", text: "“리허설 도중 쓰러졌습니다.”" },
      { type: "dialogue", speaker: "강수진", text: "“복통 9점.”" }, { type: "dialogue", speaker: "강수진", text: "“구토 한 번.”" },
      { type: "dialogue", speaker: "강수진", text: "“임신반응은 음성입니다.”" }, { type: "prose", text: "하린은 몸을 약간 웅크린 채 플레이어를 본다." },
      { type: "dialogue", speaker: "윤하린", text: "“또 설명해야 돼요?”" },
    ], choices: [
      { id: "from-start", label: "“제가 처음 듣습니다. 처음부터 말해주세요.”", effects: [{ type: "trust", patientId: "harin", amount: 4 }], next: "ER_002" },
      { id: "essentials", label: "“필요한 것만 확인하겠습니다.”", next: "ER_002" },
      { id: "hurts", label: "“많이 아프죠?”", effects: [{ type: "trust", patientId: "harin", amount: -1 }, { type: "flag", key: "er001_hurts_response", value: true }], next: "ER_002" },
    ] },
    ER_002: { id: "ER_002", title: "첫 질문 선택", blocks: [
      { type: "dialogue", speaker: "윤하린", text: "“그 질문 오늘 네 번째예요.”", conditions: [{ type: "flag", key: "er001_hurts_response" }] },
    ], onExit: [{ type: "flag", key: "er001_hurts_response", value: false }], choices: [
      ...hubCategories.map(([category, label, next]) => ({ id: category, label, next, conditions: [{ type: "flag" as const, key: `er002_${category}_complete`, value: false }] })),
      { id: "proceed", label: "신체진찰로 진행한다", conditions: [{ type: "flagCount", keys: hubFlags, operator: "gte", value: 3 }], next: "ER_003" },
    ] },
    ER_PAIN_01: { id: "ER_PAIN_01", blocks: [
      d("플레이어", "“언제부터 시작됐습니까?”"), d("윤하린", "“오늘 오후요.”"), d("윤하린", "“처음에는 그냥 속이 꼬이는 느낌이었어요.”"), d("윤하린", "“리허설하면서 갑자기 심해졌고요.”"),
      d("플레이어", "“어디가 가장 아픕니까?”"), d("윤하린", "“…모르겠어요.”"), d("윤하린", "“그냥 다 아파요.”"),
    ], onEnter: [clue("diffuse_severe_abdominal_pain")], choices: go("ER_PAIN_02") },
    ER_PAIN_02: { id: "ER_PAIN_02", blocks: [d("플레이어", "“이런 통증은 처음입니까?”"), d("윤하린", "“이 정도는 처음이에요.”"),
      thought("suspicion", "질문에는 답했다.\n처음이라고는 안 했다.", 3), thought("history", "‘이 정도’라는 말은 이전 경험을 전제로 한다.", 3),
    ], choices: [{ id: "ask-previous", label: "이전에도 비슷한 통증이 있었는지 구체적으로 묻는다", check: { id: "pain-history", ability: "history", dc: 8 }, next: { success: "ER_PAIN_SUCCESS", failure: "ER_PAIN_FAILURE" } }] },
    ER_PAIN_SUCCESS: outcome("ER_PAIN_SUCCESS", [d("윤하린", "“두 번 정도요.”")], [{ type: "flag", key: "previous_attacks_known", value: true }, clue("previous_attacks"), done("pain")]),
    ER_PAIN_FAILURE: outcome("ER_PAIN_FAILURE", [d("윤하린", "“그냥 배탈 같은 거였어요.”")], [done("pain")]),
    ER_GI_01: { id: "ER_GI_01", blocks: [d("플레이어", "“설사나 변비는요?”"), d("윤하린", "“변비요.”"), d("윤하린", "“한… 사흘?”"), d("플레이어", "“구토는?”"), d("윤하린", "“오늘 한 번.”"), thought("mechanism", "장이 멈추고 있다.\n기계적으로 막힌 것인지,\n신경이 느려진 것인지 아직 모른다.", 4)], onEnter: [clue("constipation"), clue("vomiting"), done("gi")], choices: back("gi") },
    ER_MED_01: { id: "ER_MED_01", blocks: [d("플레이어", "“평소 복용약 있습니까?”"), d("윤하린", "“없어요.”"), thought("suspicion", "사람마다 ‘약’의 정의가 다르다.", 3)], choices: [
      { id: "prescription", label: "처방약만 다시 확인한다", next: "ER_MED_PRESCRIPTION" },
      { id: "broaden", label: "건강기능식품, 한약, 피임약까지 범위를 넓힌다", conditions: [trust("gte",55)], next: "ER_MED_02" },
      { id: "broaden-low", label: "건강기능식품, 한약, 피임약까지 범위를 넓힌다", conditions: [trust("lt",55)], next: "ER_MED_NONE" },
    ] },
    ER_MED_PRESCRIPTION: outcome("ER_MED_PRESCRIPTION", [d("윤하린", "“없어요.”")], [done("med")]),
    ER_MED_NONE: outcome("ER_MED_NONE", [d("윤하린", "“정말 없어요.”")], [done("med")]),
    ER_MED_02: { id: "ER_MED_02", blocks: [d("윤하린", "“비타민은 먹어요.”"), p("잠깐 멈춘다."), thought("empathy", "뭔가 하나 더 떠올렸다.\n말할 가치가 없다고 판단한 것뿐일 수도 있다.", 4), thought("suspicion", "멈췄다.", 4)], onEnter: [{ type: "flag", key: "medication_incomplete", value: true }, done("med")], choices: back("med") },
    ER_LIFE_01: { id: "ER_LIFE_01", blocks: [d("플레이어", "“최근 잠은 잘 잡니까?”"), d("윤하린", "“공연 앞두고 잘 자는 배우가 있나요?”"), thought("history", "숫자.", 3), d("플레이어", "“평균 몇 시간 정도 잡니까?”"), d("윤하린", "“두 시간… 세 시간?”")], onEnter: [clue("severe_sleep_deprivation")], choices: go("ER_LIFE_02") },
    ER_LIFE_02: { id: "ER_LIFE_02", blocks: [d("플레이어", "“오늘은 뭐 드셨습니까?”"), d("윤하린", "“커피.”"), d("윤하린", "“…프로틴바 반 개.”"), d("플레이어", "“그게 전부입니까?”"), d("윤하린", "“오늘은요.”"), thought("suspicion", "오늘만 그런 것처럼 대답했다.", 3), thought("empathy", "부끄러워하고 있다.", 3)], onEnter: [done("life")], choices: back("life") },

    ER_003: { id: "ER_003", title: "신체진찰", blocks: [p("통증의 모양을 다시 확인한다.")], choices: [
      ...examCategories.map(([category,label,next]) => ({ id: category, label, next, conditions: [{ type: "flag" as const, key: `exam_${category}_complete`, value: false }] })),
      { id: "proceed", label: "초기 검사를 확인한다", conditions: [{ type: "flag", key: "exam_abd_complete" }, { type: "flagCount", keys: examFlags, operator: "gte", value: 2 }], next: "ER_004" },
    ] },
    EXAM_ABD_01: { id: "EXAM_ABD_01", blocks: [p("하린은 손이 닿기 전부터 긴장한다."), p("복부는 부드럽다."), p("전반적인 압통은 있지만 명확한 국소점이 없다."), p("반발통 없음.\n근육 경직 없음.\n장음은 다소 감소."), d("윤하린", "“이상하죠?”"), d("윤하린", "“이렇게 아픈데 누르면 생각보다 안 아픈 거.”"), thought("reasoning", "통증은 진짜다.\n다만 복막에서 오는 통증처럼 보이지 않는다.", 3), thought("mechanism", "배가 아프다고\n배가 원인이라는 보장은 없어.", 4)], onEnter: [clue("soft_abdomen"), clue("no_peritoneal_sign"), clue("pain_exam_discordance"), examDone("abd")], choices: examBack("abd") },
    EXAM_CV_01: { id: "EXAM_CV_01", blocks: [p("빈맥.\n혈압 상승.\n발열 없음.\n피부는 약간 축축하다.")], onEnter: [clue("tachycardia"), clue("hypertension"), clue("afebrile"), examDone("cv")], choices: examBack("cv") },
    EXAM_NEURO_01: { id: "EXAM_NEURO_01", blocks: [p("명백한 국소 신경학적 결손 없음."), thought("observation", "침대에서 일어날 때\n허벅지를 한 번 짚었다.", 4)], onEnter: [{ type: "conditional", conditions: [ability("observation",4)], effects: [{ type: "flag", key: "early_motor_hint", value: true }] }, examDone("neuro")], choices: examBack("neuro") },
    ER_004: { id: "ER_004", title: "초기 검사 선택", blocks: [s("이미 시행된 기본검사\nCBC\nElectrolytes\nLFT\nLipase\nCreatinine\nGlucose\nβ-hCG")], choices: [
      { id: "ct", label: "복부 CT", next: "LAB_001" }, { id: "ultrasound", label: "복부 초음파", timeCost: 10, next: "ER_004_US" }, { id: "wait", label: "우선 검사 결과를 기다리며 재평가", timeCost: 20, next: "ER_004_WAIT" },
    ] },
    ER_004_US: { id: "ER_004_US", blocks: [p("초음파로 통증을 설명할 뚜렷한 이상은 보이지 않는다."), p("통증은 지속된다.")], choices: [{ id: "return", label: "복부 CT를 검토한다", next: "ER_004" }] },
    ER_004_WAIT: { id: "ER_004_WAIT", blocks: [p("시간이 지나도 통증은 지속된다.")], choices: [{ id: "return", label: "복부 CT를 검토한다", next: "ER_004" }] },
    LAB_001: { id: "LAB_001", title: "기본 검사 결과", blocks: [s("WBC 10,800\nCRP low\nAST/ALT unremarkable\nLipase normal\nCreatinine normal\nGlucose normal\nNa 128"), d("강수진", "“나트륨이 조금 낮네요.”"), thought("reasoning", "구토와 섭취 감소로도 가능하다."), thought("mechanism", "기억해둬.\n아직 의미를 정하진 말고.", 3)], onEnter: [clue("hyponatremia_initial"), { type: "timeline", entry: { id: "na128", time: 1195, kind: "clinical", text: "Na 128" } }], choices: go("ER_005") },
    ER_005: { id: "ER_005", blocks: [d("윤하린", "“선생님.”"), d("윤하린", "“이번에도 아무것도 안 나오면요?”")], choices: [
      { id: "good", label: "“좋은 일이죠.”", effects: [{ type: "trust", patientId: "harin", amount: -6 }], next: "ER_005_A" },
      { id: "other", label: "“그러면 다른 설명을 찾겠습니다.”", effects: [{ type: "trust", patientId: "harin", amount: 6 }], next: "CT_001" },
      { id: "valid", label: "“검사가 정상이어도 통증이 없는 건 아닙니다.”", effects: [{ type: "trust", patientId: "harin", amount: 10 }, { type: "resonance", ability: "empathy", amount: 1 }], next: "ER_005_C" },
    ] },
    ER_005_A: { id: "ER_005_A", blocks: [d("윤하린", "“그렇죠.”")], choices: go("CT_001") },
    ER_005_C: { id: "ER_005_C", blocks: [d("윤하린", "“…그 말은 처음 듣네요.”")], choices: go("CT_001") },
    CT_001: { id: "CT_001", presentation: { timeLabel: "20:32" }, blocks: [s("20:32"), p("하린이 침대째 이동한다."), thought("observation", "몸을 움직일 때\n복통보다 다리에 힘을 주는 걸 더 싫어한다.", 3)], onEnter: [{ type: "setTime", value: 1232 }, { type: "conditional", conditions: [ability("observation",3)], effects: [{ type: "flag", key: "early_motor_hint", value: true }] }], choices: go("CT_002") },
    CT_002: { id: "CT_002", presentation: { timeLabel: "21:04" }, blocks: [s("21:04"), s("급성 충수염 없음.\n기계적 장폐색 없음.\n췌담도 응급 병변 없음.\n복강 내 출혈 없음.\n명확한 급성 골반 병변 없음."), p("급성 복통을 설명할 뚜렷한 구조적 이상 없음."), thought("reasoning", "위험한 흔한 것 몇 개는 내려갔다."), thought("suspicion", "몇 개뿐이다."), thought("observation", "영상은 정상.\n환자는 아니다."), thought("mechanism", "장기에서 시작한 문제가 아닐 수도 있어.", 4)], onEnter: [{ type: "setTime", value: 1264 }, { type: "timeline", entry: { id: "ct-clear", time: 1264, kind: "clinical", text: "CT: 구조적 원인 없음" } }], choices: go("CT_003") },
    CT_003: { id: "CT_003", blocks: [d("윤하린", "“없죠?”"), d("플레이어", "“급성 복통을 설명할 구조적 이상은—”"), d("윤하린", "“그 말.”"), d("윤하린", "“그 말 두 번 들었어요.”")], choices: [
      { id: "records", label: "과거 진료 기록을 확인한다", next: "HIST_001" }, { id: "ask", label: "하린에게 직접 이전 병력을 묻는다", next: "HIST_002" }, { id: "explain", label: "검사가 정상이라는 점부터 설명한다", next: "HIST_003" },
    ] },
    HIST_001: { id: "HIST_001", blocks: [s("기록 1\n16개월 전\n복통 / 구토\nCT negative\n위염 의증\n\n기록 2\n7개월 전\n복통\n심계항진\n불면\n과호흡\nNa 133\n불안 관련 증상 가능성"), thought("reasoning", "그때 133은 별것 아니었다.", 3), thought("mechanism", "지금은 별것 아닐 수도 있다는 뜻은 아니지.")], onEnter: [{ type: "flag", key: "previous_attacks_known", value: true }, { type: "flag", key: "previous_Na133_known", value: true }, clue("previous_attacks"), clue("previous_Na133")], choices: go("CASE_001") },
    HIST_002: { id: "HIST_002", blocks: [d("윤하린", "“작년에 한 번.”"), d("윤하린", "“그리고 몇 달 전에 한 번.”"), d("윤하린", "“검사 다 했는데 아무것도 없었어요.”"), d("윤하린", "“두 번째는 정신과 얘기도 들었어요.”", [trust("gte",60)]), d("윤하린", "“제가 불안해서 아픈 거래요.”", [trust("gte",60)])], onEnter: [{ type: "flag", key: "previous_attacks_known", value: true }, clue("previous_attacks")], choices: go("CASE_001") },
    HIST_003: { id: "HIST_003", blocks: [d("플레이어", "“CT는 위험한 몇 가지 병의 가능성을 낮춰줬습니다.”"), d("플레이어", "“통증의 원인이 없다는 뜻은 아닙니다.”"), d("윤하린", "“그럼 계속 보는 거예요?”"), d("플레이어", "“네.”")], onEnter: [{ type: "trust", patientId: "harin", amount: 5 }], choices: go("HIST_001") },
    CASE_001: { id: "CASE_001", title: "Case Conference", presentation: { mode: "cinematic" }, blocks: [s("심한 비국소성 복통\n복막자극징후 없음\n변비\n빈맥\n고혈압\nNa 128\n정상 CT"), s("반복된 과거 발작", [{ type: "flag", key: "previous_attacks_known" }]), thought("reasoning", "다시 분류한다."), p("급성 복부 질환\n독성/약물\n내분비/자율신경\n기능성/정신과적\n신경학적"), thought("mechanism", "하나의 장기에서 시작한 그림이 아닐 수도 있다.", 4)], choices: anchors.map(([id,label]) => ({ id, label, effects: [{ type: "value" as const, key: "initial_anchor", value: id }], next: "ER_006" })) },
    ER_006: { id: "ER_006", presentation: { timeLabel: "21:46", clinicalData: [{ label: "Na", value: "124", tone: "warning" }] }, blocks: [d("강수진", "“선생님, 다시 전해질 나왔습니다.”"), s("Na 124"), d("플레이어", "“128에서?”"), d("강수진", "“네.”"), d("강수진", "“그리고 화장실 갔다 오다가 주저앉았어요.”")], onEnter: [{ type: "setTime", value: 1306 }, { type: "timeline", entry: { id: "na124", time: 1306, kind: "clinical", text: "Na 124" } }, { type: "disease", patientId: "harin", stage: "progressing" }], choices: go("ER_007") },
    ER_007: { id: "ER_007", blocks: [d("윤하린", "“다리에 쥐가 난 거예요.”"), p("근위부 하지 근력 경도 저하.\n손 떨림.\n감각 이상 뚜렷하지 않음."), { type: "thought", ability: "observation", text: "처음부터 조금씩 있었다.", conditions: [ability("observation",3), { type: "flag", key: "early_motor_hint" }] }], onEnter: [clue("proximal_weakness"), clue("fine_tremor"), clue("progressive_hyponatremia"), { type: "conditional", conditions: [ability("observation",3), { type: "flag", key: "early_motor_hint" }], effects: [{ type: "flag", key: "early_weakness_known", value: true }] }], choices: go("ER_008") },
    ER_008: { id: "ER_008", blocks: [s("serum osmolality low\nurine osmolality inappropriately concentrated"), thought("mechanism", "물을 버려야 하는데 붙잡고 있다.", 3), thought("reasoning", "SIADH 형태."), thought("mechanism", "질문을 바꿔."), thought("mechanism", "왜 복통 환자가 이걸 만들지?")], onEnter: [clue("siadh_pattern")], choices: go("URINE_001") },
    URINE_001: { id: "URINE_001", blocks: [p("검체가 간호 스테이션에 있다."), thought("observation", "색.", 4), d("플레이어", "“이거 아까보다 진해졌습니까?”", [ability("observation",4)]), d("강수진", "“그런 것 같기도 하고요.”", [ability("observation",4)]), { type: "thought", ability: "reasoning", text: "농축됐을 수도 있다.", conditions: [ability("observation",4)] }, { type: "thought", ability: "observation", text: "그래서 기록만.", conditions: [ability("observation",4)] }], onEnter: [{ type: "conditional", conditions: [ability("observation",4)], effects: [{ type: "flag", key: "urine_color_known", value: true }] }], choices: go("ER_009") },
    ER_009: { id: "ER_009", blocks: [d("플레이어", "“최근 식사량을 다시 확인하고 싶습니다.”"), d("윤하린", "“그게 왜 중요해요?”"), d("윤하린", "“제가 안 먹어서 이러는 거라고요?”")], choices: [
      { id: "empathy", label: "∿ 공감 — 섭식 문제로 단정하려는 게 아닙니다.", check: { id: "diet-empathy", ability: "empathy", dc: 8 }, next: { success: "EMP_SUCCESS", failure: "EMP_FAILURE" } },
      { id: "history", label: "? 문진 — 지난 7일을 날짜별로 확인하겠습니다.", check: { id: "diet-history", ability: "history", dc: 9 }, next: { success: "HIS_SUCCESS", failure: "HIS_FAILURE" } },
      { id: "suspicion", label: "／ 의심 — 정보를 숨기면 진단이 늦어집니다.", check: { id: "diet-suspicion", ability: "suspicion", dc: 10 }, next: { success: "SUS_SUCCESS", failure: "SUS_FAILURE" } },
      { id: "skip", label: "일단 넘어간다", next: "ER_010" },
    ] },
    EMP_SUCCESS: checkOutcome("EMP_SUCCESS", [d("플레이어", "“평소와 달라진 걸 찾는 겁니다.”"), d("윤하린", "“…요즘 거의 안 먹긴 했어요.”"), d("윤하린", "“공연 때문에.”")], 6, true),
    EMP_FAILURE: checkOutcome("EMP_FAILURE", [d("윤하린", "“다들 그렇게 말해요.”")], -3),
    HIS_SUCCESS: checkOutcome("HIS_SUCCESS", [d("플레이어", "“아침?”"), d("윤하린", "“커피.”"), d("플레이어", "“점심?”"), d("윤하린", "“안 먹었어요.”"), d("플레이어", "“저녁?”"), d("윤하린", "“프로틴바나 요거트.”"), d("플레이어", "“며칠째입니까?”"), d("윤하린", "“…일주일 넘게.”")], 1, true),
    HIS_FAILURE: checkOutcome("HIS_FAILURE", [d("윤하린", "“기억 안 나요.”")], 0),
    SUS_SUCCESS: checkOutcome("SUS_SUCCESS", [d("윤하린", "“제가 뭘 숨겼는데요?”"), d("플레이어", "“저도 아직 모릅니다.”"), d("윤하린", "“요즘 거의 안 먹었어요.”")], -6, true),
    SUS_FAILURE: checkOutcome("SUS_FAILURE", [d("윤하린", "“그럼 다른 의사 불러주세요.”")], -10),
    ER_010: { id: "ER_010", blocks: [d("플레이어", "“최근 열흘 사이 새로 시작한 게 정말 없습니까?”", [medGate]), d("윤하린", "“…생리 미루려고 먹는 건 있어요.”", [medGate, trust("gte",75)]), d("윤하린", "“없어요.”", [medGate, trust("lt",75)])], onEnter: [{ type: "conditional", conditions: [medGate, trust("gte",75)], effects: [{ type: "flag", key: "ocp_known", value: true }] }], choices: go("FIELD_GATE") },
    FIELD_GATE: { id: "FIELD_GATE", title: "FIELD INVESTIGATION", blocks: [d("플레이어", "“집이나 연습실에서 최근 달라진 걸 확인하고 싶습니다.”"), d("윤하린", "“…왜요?”"), d("플레이어", "“약, 음식, 환경 노출 같은 걸 직접 확인하려고 합니다.”"), s("진료실 밖에도 병력은 있다.")], choices: [
      { id: "apartment", label: "집을 조사한다", terminal: true, effects: [{ type: "value", key: "field_intent", value: "apartment" }] },
      { id: "rehearsal", label: "연습실을 조사한다", terminal: true, effects: [{ type: "value", key: "field_intent", value: "rehearsal" }] },
      { id: "family", label: "가족에게 확인한다", terminal: true, effects: [{ type: "value", key: "field_intent", value: "family" }] },
    ] },
  },
};

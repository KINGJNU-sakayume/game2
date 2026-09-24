import type { ChapterDefinition, PlayerState, StoryNode } from "@/game/types";

export const defaultPlayer: PlayerState = {
  name: "당직의",
  abilities: { observation: 3, empathy: 1, reasoning: 1, resolve: 1 },
};

const continueTo = (next: string) => [{ id: `continue-${next}`, label: "계속", next }];
const hubCategories = [
  ["pain", "[통증에 대해 묻는다]", "ER_PAIN_01"],
  ["gi", "[소화기 증상을 묻는다]", "ER_GI_01"],
  ["med", "[약물과 과거력을 확인한다]", "ER_MED_01"],
  ["life", "[최근 생활을 묻는다]", "ER_LIFE_01"],
] as const;

const placeholderNodes = Object.fromEntries(hubCategories.map(([category, , id]) => [id, {
  id,
  blocks: [],
  onEnter: [{ type: "flag", key: `er002_${category}_complete`, value: true }],
  choices: [{ id: `return-${category}`, label: "첫 질문 선택으로 돌아간다", next: "ER_002" }],
} satisfies StoryNode]));

export const demoChapter: ChapterDefinition = {
  id: "chapter-01",
  title: "CHAPTER 1 — 아무것도 없는 배",
  startNodeId: "PR_001",
  initial: {
    time: 0,
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
    ER_001: { id: "ER_001", title: "19:55 응급실", presentation: { imageKey: "erInitial", timeLabel: "19:55", location: "응급실 07" }, blocks: [
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
      { id: "proceed", label: "다음 단계로 진행한다", conditions: [
        { type: "flag", key: "er002_pain_complete" }, { type: "flag", key: "er002_gi_complete" }, { type: "flag", key: "er002_med_complete" },
      ], next: "ER_003" },
    ] },
    ...placeholderNodes,
    ER_003: { id: "ER_003", blocks: [] },
  },
};

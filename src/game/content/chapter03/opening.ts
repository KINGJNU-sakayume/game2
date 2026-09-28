import type { Condition, StoryNode } from "@/game/types";
import {
  SUNRYE, any, all, at, atLeast, clue, clockTo, d, flag, go, herTrust, log, me, memoryVoice, minutes, p, s, setFlag, setValue, stamp, test, thought, voice, when,
} from "./helpers";

const done = (name: string) => setFlag(`hub_${name}_done`);
const back = (name: string) => [{ id: `return-${name}`, label: "다른 것을 확인한다", next: "ER_002" }];
const hub = [
  ["fever", "열과 지난 엿새를 묻는다", "ER_FEVER"],
  ["meds", "먹고 있는 약을 확인한다", "ER_MEDS"],
  ["skin", "팔과 몸통의 발진을 본다", "ER_SKIN"],
  ["travel", "추석 이후 어디에 있었는지 묻는다", "ER_TRAVEL"],
] as const;
const hubFlags = hub.map(([id]) => `hub_${id}_done`);
const anchors = [
  ["urosepsis", "요로감염 · 패혈증"],
  ["drug", "약물 반응"],
  ["viral", "바이러스 감염"],
  ["vector", "진드기 · 풀숲 매개 감염"],
  ["pneumonia", "폐렴"],
] as const;

/** Autumn fever after outdoor work is reason enough to cover it empirically, eschar or not. */
export const doxyIndicated: Condition = any(flag("eschar_found"), all(flag("grass_exposure_known"), any(atLeast("reasoning", 3), atLeast("mechanism", 3), atLeast("history", 3))));

export const openingNodes: Record<string, StoryNode> = {
  // ── PROLOGUE ────────────────────────────────────────────────────────────
  PR_001: {
    id: "PR_001",
    presentation: { hideTime: true, hideCase: true, backdrop: "field", location: "상월리 뒷산" },
    blocks: [
      stamp("추석 사흘 전"),
      p("예초기 소리가 멎자 풀 냄새가 올라온다."),
      p("순례는 산소 앞 잔디에 앉아 도시락 뚜껑을 연다.\n옆집 영자가 그 옆에 앉는다."),
      p("바지 밑단을 양말 속에 넣으라던 아들 말은, 올해도 잊었다."),
      thought("observation", "봉분 둘레 풀이 무릎까지 올라와 있다.", 3),
    ],
    choices: go("PR_002"),
  },
  PR_002: {
    id: "PR_002",
    presentation: { hideTime: true, hideCase: true, backdrop: "home-night", location: "서울 · 딸의 아파트" },
    blocks: [
      stamp("추석 지나고 열흘"),
      p("딸의 아파트 거실. 순례는 소파에서 일어나지 못한다."),
      d("이수경", "“엄마, 병원 가자. 열이 39도야.”"),
      d("문순례", "“감기라니까. 약 먹었어.”"),
      p("수경이 엄마 소매를 걷는다. 팔에 붉은 반점이 번져 있다."),
    ],
    choices: go("PR_003"),
  },
  PR_003: {
    id: "PR_003",
    presentation: { mode: "immersive", hideCase: true, backdrop: "phone" },
    onEnter: [{ type: "setTime", value: at(21, 20) }],
    blocks: [
      stamp("21:20"),
      d("서지안", "“진단팀이죠? 응급실입니다.”"),
      d("서지안", "“일흔여섯 여자분, 엿새째 열이요. 동네 병원 항생제를 먹었는데도 안 떨어졌고, 오늘은 좀 헷갈려하세요.”"),
      d("서지안", "“소변에 백혈구가 나와서 요로감염 같긴 한데… 몸에 발진이 있어요.”"),
    ],
    choices: go("PR_004"),
  },
  PR_004: {
    id: "PR_004",
    title: "아무도 보지 않은 곳",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, titleStyle: "chapter", titleCaption: "CHAPTER 3", autoAdvanceMs: 2400, backdrop: "paper" },
    blocks: [],
    autoNext: "ER_001",
  },

  // ── ACT 1 · FIRST CONTACT ───────────────────────────────────────────────
  ER_001: {
    id: "ER_001",
    title: "응급실 11",
    presentation: {
      backdrop: "er-night", assetId: "SCN3_001_ER_NIGHT", timeLabel: "21:40", location: "응급실 11", titleStyle: "place",
      clinicalData: [{ label: "T", value: "39.2", tone: "warning" }, { label: "HR", value: "112", tone: "warning" }, { label: "BP", value: "98/60" }, { label: "SpO2", value: "93%", tone: "warning" }],
    },
    onEnter: [{ type: "setTime", value: at(21, 40) }, log("arrival", "응급실 도착", "clinical", at(21, 40)), clue("fever_6days"), clue("hypoxemia")],
    blocks: [
      d("서지안", "“소변 백혈구 10에서 20. 세프트리악손 걸어두려고요.”"),
      p("침대 위의 할머니가 이불 끝을 턱까지 끌어올리고 있다. 옆에 선 딸의 눈이 빨갛다."),
      d("문순례", "“여기가… 수경이 집이냐?”"),
      d("이수경", "“엄마, 병원이야.”"),
    ],
    choices: [
      { id: "to-patient", label: "“어머님, 성함하고 오늘이 며칠인지 말씀해 주시겠어요?”", effects: [herTrust(3)], next: "ER_001_ORIENT" },
      { id: "to-daughter", label: "“언제부터 편찮으셨는지 처음부터 말씀해 주세요.”", effects: [herTrust(1)], next: "ER_002" },
      { id: "to-resident", label: "“요로감염이면 항생제부터 가죠.”", effects: [setFlag("anchor_uti_early"), herTrust(-2)], next: "ER_002" },
    ],
  },
  ER_001_ORIENT: {
    id: "ER_001_ORIENT",
    blocks: [
      d("문순례", "“문순례. 오늘은… 추석 지났지?”"),
      p("날짜는 대지 못한다. 대신 손을 뻗어 딸의 소매를 잡는다."),
      thought("observation", "눈이 붉다. 울어서가 아니라 결막이 충혈돼 있다.", 3),
      thought("empathy", "모른다는 걸 들키고 싶지 않아 한다.", 3),
    ],
    onEnter: [clue("confusion_elderly"), when([atLeast("observation", 3)], [clue("conjunctival_injection")])],
    choices: go("ER_002"),
  },
  ER_002: {
    id: "ER_002",
    presentation: { prompt: "무엇부터 확인할까." },
    blocks: [],
    choices: [
      ...hub.map(([id, label, next]) => ({ id, label, next, conditions: [flag(`hub_${id}_done`, false)] })),
      { id: "proceed", label: "검사 결과를 본다", conditions: [{ type: "flagCount", keys: hubFlags, operator: "gte", value: 3 }], next: "ER_003" },
    ],
  },
  ER_FEVER: {
    id: "ER_FEVER",
    blocks: [
      d("이수경", "“엿새 전부터요. 오한 나고, 머리 아프고, 온몸이 쑤신다고.”"),
      d("이수경", "“사흘 전에 동네 의원에서 항생제를 받았어요. 세픽심이요. 근데 열이 그대로예요.”"),
      thought("mechanism", "세팔로스포린을 사흘 먹고도 그대로인 열.\n세포 안에 숨는 균은 그 약이 닿지 않는다.", 3),
    ],
    onEnter: [clue("headache_myalgia"), clue("cephalosporin_failure"), done("fever")],
    choices: back("fever"),
  },
  ER_MEDS: {
    id: "ER_MEDS",
    blocks: [
      d("이수경", "“혈압약은 오래 드셨고요. 아, 통풍약을 새로 받으셨어요. 삼 주 전에.”"),
      s("알로퓨리놀 100 mg · 3주 전 시작"),
      thought("suspicion", "새 약. 발진. 열. 삼 주.", 3),
      thought("mechanism", "알로퓨리놀 과민반응은 우리나라 사람에게 드물지 않다.\n다만 과민반응이라면 호산구가 먼저 말해준다.", 4),
    ],
    onEnter: [clue("new_allopurinol"), setFlag("allopurinol_known"), done("meds")],
    choices: back("meds"),
  },
  ER_SKIN: {
    id: "ER_SKIN",
    blocks: [
      p("소매를 걷는다. 붉은 반점이 몸통에서 시작해 팔로 번졌다. 누르면 옅어진다. 가렵지는 않다."),
      p("겨드랑이에 콩알만 한 림프절이 만져진다."),
      thought("observation", "발진은 보여준 곳까지만 보았다.", 3),
    ],
    onEnter: [clue("trunk_rash"), clue("lymphadenopathy"), done("skin")],
    choices: back("skin"),
  },
  ER_TRAVEL: {
    id: "ER_TRAVEL",
    blocks: [
      d("이수경", "“추석에 시골 다녀왔어요. 엄마는 거기 혼자 사세요. 전북 상월리.”"),
      d("이수경", "“열이 안 떨어져서 어제 제가 모시고 올라왔어요.”"),
      d("문순례", "“산소 풀 좀 뽑았지. 영자랑.”"),
      d("이수경", "“비 그치고 논일도 하셨고요. 창고 정리도 하시고.”"),
      thought("history", "풀. 논. 창고. 가을.\n이 네 단어가 한 줄에 서 있다.", 3),
      memoryVoice("patient_is_never_one", "영자. 같이 풀밭에 앉은 사람이 있다."),
    ],
    onEnter: [clue("beolcho"), clue("rice_paddy"), clue("storehouse_mice"), setFlag("grass_exposure_known"), setFlag("rural_known"), done("travel")],
    choices: back("travel"),
  },
  ER_003: {
    id: "ER_003",
    blocks: [
      s("WBC 4,100 · 호산구 1%\n혈소판 86,000\nAST 148 · ALT 121 · 빌리루빈 1.1\nCRP 11.2 mg/dL · Na 131 · Cr 1.2\n소변 백혈구 10–20 · 아질산염 음성 · 단백 음성\n코로나 · 독감 PCR 음성\n흉부 사진 · 양측 간질성 음영"),
      d("서지안", "“소변 백혈구, 열, 혼돈. 요로패혈증 맞는 것 같은데요.”"),
      thought("reasoning", "열이 나면 소변에도 백혈구가 나온다.\n아질산염은 음성이다.", 3),
      thought("mechanism", "혈소판, 간, 폐, 피부.\n방광 하나로는 이걸 다 못 만든다.", 4),
    ],
    onEnter: [
      clockTo(at(22, 5)), clue("thrombocytopenia"), clue("elevated_liver_enzymes"), clue("pyuria_nitrite_negative"),
      clue("no_eosinophilia"), clue("no_proteinuria"), clue("interstitial_cxr"), test(SUNRYE, "covid_flu", "negative"), test(SUNRYE, "blood_culture", "pending"),
    ],
    choices: go("CASE_001", "생각을 정리한다"),
  },
  CASE_001: {
    id: "CASE_001",
    title: "증례 토의",
    presentation: { mode: "conference", titleStyle: "phase", titleCaption: "CASE CONFERENCE · 1", backdrop: "board", prompt: "어느 쪽부터 의심할까." },
    blocks: [
      s("발열 6일\n두통 · 근육통\n몸통 발진\n혈소판 86,000\n간수치 상승\nSpO2 93%\n세팔로스포린 무반응"),
      s("추석 벌초 · 논 · 창고", [flag("rural_known")]),
      s("3주 전 알로퓨리놀", [flag("allopurinol_known")]),
      thought("reasoning", "요로감염이라는 말은 소변 한 줄에서 나왔다."),
      thought("history", "가을에 시골에서 온 열이다.", 3),
    ],
    choices: anchors.map(([id, label]) => ({ id, label, effects: [setValue("initial_anchor", id)], next: "ER_004" })),
  },
  ER_004: {
    id: "ER_004",
    presentation: { prompt: "오늘 밤 무엇을 할까." },
    blocks: [],
    choices: [
      { id: "search", label: "옷 속까지 전신 피부를 확인한다", conditions: [flag("skin_search_done", false)], next: "ESCHAR_ASK" },
      { id: "rdt", label: "쯔쯔가무시 신속항체검사를 보낸다", conditions: [flag("rural_known"), flag("rdt_done", false)], next: "RDT_001" },
      { id: "sfts", label: "SFTS 유전자검사를 보내고 접촉주의 격리를 한다", conditions: [flag("rural_known"), flag("sfts_sent", false)], next: "SFTS_001" },
      { id: "doxy", label: "독시사이클린을 지금 시작한다", conditions: [doxyIndicated], next: "EARLY_DOXY" },
      { id: "ceftriaxone", label: "요로감염으로 보고 세프트리악손을 시작한다", next: "CEF_001" },
      { id: "steroid", label: "약물 과민반응으로 보고 알로퓨리놀을 끊고 스테로이드를 쓴다", conditions: [flag("allopurinol_known")], next: "STEROID_001" },
    ],
  },
  ESCHAR_ASK: {
    id: "ESCHAR_ASK",
    blocks: [
      me("“어머님, 몸 전체 피부를 한번 봐야 합니다. 옷 안쪽까지요.”"),
      d("문순례", "“…영감 가고 나서 남한테 몸 보인 적 없어.”"),
      p("순례가 환자복 앞섶을 쥔다."),
      thought("empathy", "부끄러움도 증상만큼 진짜다.", 2),
    ],
    choices: [
      { id: "chaperone", label: "“간호사 선생님이랑 같이, 한 군데씩 여쭤보고 보겠습니다.”", effects: [herTrust(6), setFlag("consented_exam")], next: "ESCHAR_SEARCH" },
      { id: "daughter", label: "따님에게 대신 확인해 달라고 부탁한다", next: "ESCHAR_DAUGHTER" },
      { id: "quick", label: "“잠깐이면 됩니다.” 커튼을 치고 바로 확인한다", effects: [herTrust(-10), setFlag("exam_without_consent"), setFlag("dignity_breached")], next: "ESCHAR_SEARCH" },
      { id: "later", label: "지금은 넘어간다", next: "ER_004" },
    ],
  },
  ESCHAR_SEARCH: {
    id: "ESCHAR_SEARCH",
    blocks: [
      d("강수진", "“어머님, 저 여기 있어요. 추우시면 말씀하세요.”", [flag("consented_exam")]),
      p("두피. 귀 뒤. 겨드랑이. 팔 안쪽. 샅. 무릎 뒤. 발가락 사이."),
      p("속옷 선 아래를 들춘다."),
    ],
    choices: [{ id: "look", label: "주름 하나까지 본다", check: { id: "eschar-observation", ability: "observation", dc: 7 }, next: { success: "ESCHAR_FOUND", failure: "ESCHAR_MISSED" } }],
  },
  ESCHAR_DAUGHTER: {
    id: "ESCHAR_DAUGHTER",
    blocks: [
      p("수경이 커튼 안에서 엄마의 등과 팔, 다리를 살핀다."),
      d("이수경", "“등에도 빨간 거 말고는 없어요.”"),
      thought("observation", "딸은 발진을 봤다. 발진 아래는 보지 않았다.", 3),
    ],
    onEnter: [setFlag("skin_search_done"), setFlag("daughter_checked")],
    choices: go("ER_004", "다른 것을 정한다"),
  },
  ESCHAR_FOUND: {
    id: "ESCHAR_FOUND",
    presentation: { assetId: "EVD3_001_ESCHAR" },
    blocks: [
      p("왼쪽 가슴 아래, 속옷 선에 가려진 자리."),
      p("지름 8밀리미터. 까만 딱지. 둘레가 붉게 부풀어 있다. 아프지도 가렵지도 않았다고 한다."),
      thought("mechanism", "가피.\n털진드기 유충이 문 자리다.", 2),
      thought("reasoning", "쯔쯔가무시."),
      voice("observation", "아무도 보지 않은 곳에 있었다.", [flag("exam_without_consent", false)]),
    ],
    onEnter: [setFlag("skin_search_done"), setFlag("eschar_found"), setFlag("bite_site_known"), clue("eschar"), log("eschar", "가피 발견 · 왼쪽 가슴 아래", "clinical")],
    choices: go("ER_004", "다음을 정한다"),
  },
  ESCHAR_MISSED: {
    id: "ESCHAR_MISSED",
    blocks: [p("발진, 발진, 발진. 붉은 점들 사이에서 눈이 미끄러진다."), thought("observation", "놓친 게 있다는 느낌만 남는다.", 4)],
    onEnter: [setFlag("skin_search_done")],
    choices: go("ER_004", "다른 것을 정한다"),
  },
  RDT_001: {
    id: "RDT_001",
    blocks: [
      s("쯔쯔가무시 신속항체검사 · 음성"),
      d("서지안", "“음성이네요. 쯔쯔가무시는 아닌가 봐요.”"),
      thought("mechanism", "발병 엿새째.\n몸이 아직 항체를 다 만들지 못했을 수 있다.", 3),
      memoryVoice("normal_is_not_diagnosis", "음성도, 정상도, 진단이 아니다."),
    ],
    onEnter: [minutes(15), setFlag("rdt_done"), test(SUNRYE, "scrub_rdt", "negative"), clue("rdt_negative_early")],
    choices: go("ER_004", "다른 것을 정한다"),
  },
  SFTS_001: {
    id: "SFTS_001",
    blocks: [
      p("검체를 보내고, 커튼 밖에 접촉주의 표지를 붙인다."),
      thought("mechanism", "SFTS라면 피와 체액으로 옮는다.\n기관삽관을 하게 되면 모두가 보호구를 써야 한다.", 3),
      d("강수진", "“가운이랑 장갑 여기 둘게요.”"),
    ],
    onEnter: [minutes(10), setFlag("sfts_sent"), test(SUNRYE, "sfts_pcr", "pending")],
    choices: go("ER_004", "다른 것을 정한다"),
  },
  EARLY_DOXY: {
    id: "EARLY_DOXY",
    blocks: [
      me("“독시사이클린 100밀리그램, 지금 들어가 주세요.”"),
      d("서지안", "“항체가 음성인데요?”", [flag("rdt_done")]),
      me("“결과가 치료 시점을 정하진 않아요. 이 병은 약이 늦을수록 폐로, 뇌로 갑니다.”"),
      thought("decision", "틀려도 독시사이클린은 렙토스피라까지 덮는다.\n맞으면, 하루 반이면 열이 내린다.", 2),
      p("가피 조직을 떼어 PCR로 보낸다.", [flag("eschar_found")]),
    ],
    onEnter: [
      setFlag("early_doxy"), setValue("treatment_timing", "appropriate"), log("doxy", "독시사이클린 시작", "decision"),
      when([flag("eschar_found")], [test(SUNRYE, "eschar_pcr", "pending")]),
    ],
    choices: go("NIGHT_001", "밤을 넘긴다"),
  },
  CEF_001: {
    id: "CEF_001",
    blocks: [p("세프트리악손이 들어간다."), thought("mechanism", "사흘 동안 안 들은 계열이다. 주사로 바꾼다고 세포 안까지 닿지는 않는다.", 3)],
    onEnter: [setFlag("ceftriaxone_given")],
    choices: go("NIGHT_001", "밤을 넘긴다"),
  },
  STEROID_001: {
    id: "STEROID_001",
    blocks: [p("알로퓨리놀을 끊는다. 메틸프레드니솔론이 들어간다."), thought("suspicion", "호산구가 1%다. 과민반응이 그걸 건너뛸까.", 3), thought("mechanism", "감염이라면, 지금 면역을 누른 거다.", 4)],
    onEnter: [setFlag("steroid_given")],
    choices: go("NIGHT_001", "밤을 넘긴다"),
  },
};

import type { StoryNode } from "@/game/types";
import {
  HYEJIN, SIWOO, any, all, at, atLeast, clue, clockTo, d, flag, go, log, me, memoryVoice, minutes, momClue, momTrust, p, s, setFlag, setValue, stamp, test, thought, voice, when,
} from "./helpers";

const done = (name: string) => setFlag(`hub_${name}_done`);
const back = (name: string) => [{ id: `return-${name}`, label: "다른 것을 확인한다", next: "ER_002" }];
const hub = [
  ["gi", "구토와 배를 확인한다", "ER_GI"],
  ["neuro", "신경학적 진찰을 한다", "ER_NEURO"],
  ["mother", "보호자에게 몸 상태를 묻는다", "ER_MOM"],
  ["home", "집과 최근 며칠을 묻는다", "ER_HOME"],
] as const;
const hubFlags = hub.map(([id]) => `hub_${id}_done`);
const anchors = [
  ["gastroenteritis", "감염성 장염"],
  ["neurologic", "중추신경계 감염"],
  ["toxic", "약물 · 독성"],
  ["metabolic", "대사 이상"],
  ["environmental", "환경 노출"],
] as const;

/** Enough to suspect CO before anyone collapses: two people sick, one sealed, heated room. */
export const coSuspicion = any(all(flag("caregiver_symptoms_known"), flag("home_heating_known")), atLeast("mechanism", 4));

export const openingNodes: Record<string, StoryNode> = {
  // ── PROLOGUE ────────────────────────────────────────────────────────────
  PR_001: {
    id: "PR_001",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, backdrop: "semibasement" },
    blocks: [
      stamp("06:40"),
      p("반지하 창문 높이로 출근하는 발목들이 지나간다."),
      p("혜진은 현관에서 신발을 벗기도 전에 안다."),
      p("집이 덥다."),
      p("바닥이 따뜻하다. 팔월인데."),
      thought("observation", "벽지의 물 자국이 무릎 높이에서 멈춰 있다.", 3),
    ],
    choices: go("PR_002"),
  },
  PR_002: {
    id: "PR_002",
    presentation: { hideTime: true, hideCase: true, backdrop: "semibasement" },
    blocks: [
      p("사흘 전 빗물이 빠진 뒤로 보일러는 한 번도 꺼진 적이 없다. 장판 밑이 마를 때까지."),
      d("정혜진", "“시우야. 일어나.”"),
      p("이불 속 아이가 대답 대신 몸을 돌린다."),
      d("박시우", "“…엄마, 머리 아파.”"),
      p("혜진도 아프다. 사흘째다. 야간 근무 탓이라고 생각했다."),
    ],
    choices: go("PR_003"),
  },
  PR_003: {
    id: "PR_003",
    presentation: { hideTime: true, hideCase: true },
    blocks: [
      p("시우가 일어나다가 벽을 짚는다."),
      d("박시우", "“다리가 이상해.”"),
      p("그리고 토한다."),
      p("현관 옆 케이지 안에서 햄스터가 움직이지 않는다."),
      p("혜진은 그걸 보지 못한다."),
    ],
    choices: go("PR_004"),
  },
  PR_004: {
    id: "PR_004",
    presentation: { mode: "immersive", hideCase: true, backdrop: "phone" },
    onEnter: [{ type: "setTime", value: at(7, 31) }],
    blocks: [
      stamp("07:31"),
      d("서지안", "“진단팀이죠? 소아응급입니다.”"),
      d("서지안", "“아홉 살 남자아이, 구토하고 처지는데요. 열이 없어요.”"),
      d("서지안", "“어제 동네 소아과에서 장염이라고 했대요. 근데 애가 너무 멍해서요.”"),
    ],
    choices: go("PR_005"),
  },
  PR_005: {
    id: "PR_005",
    title: "창문을 닫은 방",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, titleStyle: "chapter", titleCaption: "CHAPTER 2", autoAdvanceMs: 2400, backdrop: "paper" },
    blocks: [],
    autoNext: "ER_001",
  },

  // ── ACT 1 · FIRST CONTACT ───────────────────────────────────────────────
  ER_001: {
    id: "ER_001",
    title: "소아응급 03",
    presentation: {
      backdrop: "er", assetId: "SCN2_001_PEDS_ER", timeLabel: "07:44", location: "소아응급 03", titleStyle: "place",
      clinicalData: [{ label: "HR", value: "128", tone: "warning" }, { label: "BP", value: "98/60" }, { label: "T", value: "36.8" }, { label: "SpO2", value: "99%" }],
    },
    onEnter: [{ type: "setTime", value: at(7, 44) }, log("arrival", "소아응급 도착", "clinical", at(7, 44)), clue("afebrile_both")],
    blocks: [
      d("서지안", "“박시우, 아홉 살. 아침부터 구토 세 번, 두통, 처짐.”"),
      d("서지안", "“열 없고요. 산소포화도 99.”"),
      d("서지안", "“수액 달고 장염으로 보면 될 것 같긴 한데… 애가 대답이 늦어요.”"),
      p("시우는 눈을 반쯤 뜬 채 천장을 본다.\n침대 옆에 선 여자가 관자놀이를 누르고 있다."),
      d("정혜진", "“장염이라면서요. 어제.”"),
    ],
    choices: [
      { id: "to-mother", label: "“어머님, 언제부터였는지 처음부터 말씀해 주세요.”", effects: [momTrust(4)], next: "ER_002" },
      { id: "to-child", label: "시우 앞에 무릎을 굽힌다. “시우야, 선생님 얼굴 보여?”", effects: [momTrust(2), setFlag("child_engaged")], next: "ER_001_CHILD" },
      { id: "to-resident", label: "“장염이면 수액부터 달고 지켜보죠.”", effects: [momTrust(-3), setFlag("anchor_ge_early")], next: "ER_002" },
    ],
  },
  ER_001_CHILD: {
    id: "ER_001_CHILD",
    blocks: [
      d("박시우", "“보여요. 근데 좀… 흐려요.”"),
      thought("observation", "대답하기 전에 한 박자를 쉰다.\n생각하는 게 아니라, 찾고 있다.", 3),
      d("박시우", "“엄마… 보리 죽었어.”"),
      d("정혜진", "“보리는 햄스터예요. 아침에 보니까 안 움직인다고.”"),
      thought("empathy", "아이는 아픈 것보다 그게 더 무섭다.", 2),
    ],
    onEnter: [clue("confusion_child"), clue("dead_pet"), setFlag("hamster_known")],
    choices: go("ER_002"),
  },
  ER_002: {
    id: "ER_002",
    presentation: { prompt: "무엇부터 확인할까." },
    blocks: [],
    choices: [
      ...hub.map(([id, label, next]) => ({ id, label, next, conditions: [flag(`hub_${id}_done`, false)] })),
      { id: "proceed", label: "초기 검사 결과를 본다", conditions: [{ type: "flagCount", keys: hubFlags, operator: "gte", value: 3 }], next: "ER_003" },
    ],
  },
  ER_GI: {
    id: "ER_GI",
    blocks: [
      me("“배는 어디가 아파?”"),
      d("박시우", "“배는… 안 아파. 머리가 아파.”"),
      p("복부는 부드럽다. 압통 없음. 장음 정상."),
      d("정혜진", "“어제 설사 한 번 했어요. 그래서 장염이라고.”"),
      thought("reasoning", "구토는 있다. 배는 조용하다.", 2),
      thought("suspicion", "장염인데 배가 멀쩡하다.", 3),
    ],
    onEnter: [clue("vomiting_child"), clue("headache_child"), clue("soft_abdomen_child"), clue("loose_stool"), done("gi")],
    choices: back("gi"),
  },
  ER_NEURO: {
    id: "ER_NEURO",
    blocks: [
      p("목은 부드럽다. 경부강직 없음.\n동공 반응 정상. 국소 신경학적 결손은 뚜렷하지 않다."),
      me("“시우야, 여기서 저기까지 걸어볼까?”"),
      p("두 번째 걸음에서 시우가 벽을 짚는다."),
      thought("mechanism", "소뇌가 흔들린다.\n감염이라면 열이 있어야 하고.", 3),
      thought("observation", "뺨이 붉다. 열도 없는데.", 4),
      thought("mechanism", "선홍빛 피부는 교과서에만 있어.\n그 한 줄에 기대지 마.", 4),
    ],
    onEnter: [clue("ataxia_child"), clue("no_meningism"), clue("confusion_child"), done("neuro")],
    choices: back("neuro"),
  },
  ER_MOM: {
    id: "ER_MOM",
    blocks: [
      me("“어머님은 괜찮으세요?”"),
      d("정혜진", "“저요? 저는 괜찮아요. 밤새 일해서 그래요.”"),
      thought("empathy", "괜찮다는 말을 너무 빨리 했다.", 3),
    ],
    choices: [
      { id: "mom-press", label: "“같은 집에서 지내셨으니까, 어머님 몸도 단서가 돼요.”", check: { id: "mom-empathy", ability: "empathy", dc: 8 }, next: { success: "ER_MOM_OPEN", failure: "ER_MOM_CLOSED" } },
      { id: "mom-leave", label: "더 묻지 않는다", next: "ER_MOM_CLOSED" },
    ],
  },
  ER_MOM_OPEN: {
    id: "ER_MOM_OPEN",
    blocks: [
      d("정혜진", "“…사흘째 머리가 아파요. 속도 울렁거리고.”"),
      d("정혜진", "“계단 올라가다 한 번 핑 돌았어요. 낮에 자려고 수면제를 먹어서 그런가.”"),
      thought("suspicion", "같은 방. 같은 두통.", 2),
    ],
    onEnter: [momClue("caregiver_headache"), momClue("sleeping_pills"), setFlag("caregiver_symptoms_known"), setFlag("sleeping_pills_known"), momTrust(3), done("mother")],
    choices: back("mother"),
  },
  ER_MOM_CLOSED: {
    id: "ER_MOM_CLOSED",
    blocks: [
      d("정혜진", "“저 말고 애를 봐주세요.”"),
      p("혜진이 다시 관자놀이를 누른다."),
      thought("observation", "말은 괜찮다는데 손은 계속 머리에 가 있다.", 4),
    ],
    onEnter: [done("mother"), when([atLeast("observation", 4)], [momClue("caregiver_headache"), setFlag("caregiver_symptoms_known")])],
    choices: back("mother"),
  },
  ER_HOME: {
    id: "ER_HOME",
    blocks: [
      me("“요즘 집에 달라진 건 없었습니까?”"),
      d("정혜진", "“사흘 전 비에 집이 잠겼어요. 반지하라서.”"),
      d("정혜진", "“물 퍼내고, 장판 말리느라 보일러를 계속 틀었어요.”"),
      me("“환기는요?”"),
      d("정혜진", "“창문은 닫았죠. 하수구 냄새가 올라와서. 밤엔 무섭기도 하고.”"),
      thought("reasoning", "침수. 오염된 물. 설사.\n장염이라는 말에 이유가 하나 더 생긴다.", 2),
      thought("mechanism", "덥고, 닫혀 있고, 뭔가 타고 있다.", 4),
    ],
    onEnter: [clue("flooded_home"), clue("boiler_running"), clue("windows_closed"), setFlag("home_heating_known"), setFlag("ventilation_known"), done("home")],
    choices: back("home"),
  },
  ER_003: {
    id: "ER_003",
    blocks: [
      s("혈당 98 · Na 139 · K 4.1\nCRP 0.2 mg/dL · WBC 11,200\n요검사 정상"),
      d("서지안", "“거의 다 정상이에요. 탈수 정도?”"),
      thought("reasoning", "정상이 너무 많다.", 3),
      memoryVoice("normal_is_not_diagnosis", "정상은 진단이 아니다."),
    ],
    onEnter: [clockTo(at(8, 5)), clue("normal_labs")],
    choices: go("CASE_001", "생각을 정리한다"),
  },
  CASE_001: {
    id: "CASE_001",
    title: "증례 토의",
    presentation: { mode: "conference", titleStyle: "phase", titleCaption: "CASE CONFERENCE · 1", backdrop: "board", prompt: "어느 쪽부터 의심할까." },
    blocks: [
      s("구토 · 두통\n느린 대답 · 실조\n발열 없음\nSpO2 99%\n검사 대부분 정상"),
      s("보호자 두통", [flag("caregiver_symptoms_known")]),
      s("침수 · 보일러 · 닫힌 창", [flag("home_heating_known")]),
      thought("reasoning", "장염이라는 말은 어제 다른 의사가 쓴 문장이다."),
      thought("mechanism", "열 없는 혼돈은 감염보다 다른 쪽을 가리킨다.", 3),
    ],
    choices: anchors.map(([id, label]) => ({ id, label, effects: [setValue("initial_anchor", id)], next: "ER_004" })),
  },
  ER_004: {
    id: "ER_004",
    presentation: { prompt: "무엇을 먼저 확인할까." },
    blocks: [],
    choices: [
      { id: "cohb", label: "정맥혈가스에 일산화탄소헤모글로빈을 추가한다", conditions: [coSuspicion], next: "COHB_EARLY" },
      { id: "ct", label: "뇌 CT를 찍는다", conditions: [flag("head_ct_done", false)], next: "CT_001" },
      { id: "lp", label: "뇌수막염을 배제하러 요추천자를 준비한다", conditions: [flag("lp_done", false)], next: "LP_001" },
      { id: "tox", label: "소변 약물 선별검사를 보낸다", conditions: [flag("tox_sent", false)], next: "TOX_001" },
      { id: "fluids", label: "수액을 달고 경과를 본다", next: "FLUIDS_001" },
    ],
  },
  COHB_EARLY: {
    id: "COHB_EARLY",
    blocks: [
      thought("mechanism", "두 사람. 같은 방. 연소.\n산소포화도는 그 질문에 답하지 못한다.", 2),
      s("정맥혈가스 · co-oximetry\n박시우 · 정혜진 동시 채혈"),
      d("강수진", "“결과는 이십 분쯤이요.”"),
      thought("decision", "산소는 검사 결과를 기다리지 않는다."),
    ],
    onEnter: [setFlag("cohb_ordered"), test(SIWOO, "vbg_cohb", "pending"), test(HYEJIN, "vbg_cohb", "pending"), log("cohb-ordered", "COHb 의뢰", "test")],
    choices: [
      { id: "o2-now", label: "두 사람 모두 100% 산소를 지금 시작한다", effects: [setFlag("o2_early")], next: "O2_EARLY" },
      { id: "o2-wait", label: "결과를 보고 산소를 결정한다", effects: [minutes(20), setFlag("o2_waited")], next: "MOM_001" },
    ],
  },
  O2_EARLY: {
    id: "O2_EARLY",
    blocks: [d("강수진", "“비재호흡 마스크 두 개 준비할게요.”"), p("마스크 두 개. 침대 두 개.\n혜진은 자기 마스크를 한참 쳐다보다가 쓴다.")],
    onEnter: [log("o2-started", "100% 산소 시작 (두 사람)", "decision")],
    choices: go("MOM_001"),
  },
  CT_001: {
    id: "CT_001",
    blocks: [stamp("08:31"), s("뇌 CT\n출혈 없음 · 종괴 없음 · 부종 없음"), d("서지안", "“깨끗해요.”"), memoryVoice("normal_is_not_diagnosis", "깨끗한 건 사진이다.")],
    onEnter: [minutes(25), setFlag("head_ct_done"), test(SIWOO, "head_ct", "negative"), clue("normal_ct")],
    choices: go("MOM_001"),
  },
  LP_001: {
    id: "LP_001",
    blocks: [
      p("CT를 먼저 확인하고, 시우를 옆으로 눕힌다. 혜진이 아이 손을 잡는다."),
      s("뇌척수액\n백혈구 1/μL · 단백 24 · 당 62\n그람 염색 음성"),
      thought("reasoning", "뇌수막염은 내려간다."),
      thought("empathy", "아이는 등에 바늘이 들어가는 동안 한 번도 울지 않았다.\n그게 더 걱정이다.", 3),
    ],
    onEnter: [minutes(40), setFlag("lp_done"), setFlag("head_ct_done"), test(SIWOO, "head_ct", "negative"), test(SIWOO, "lumbar_puncture", "negative"), clue("normal_ct"), clue("normal_csf")],
    choices: go("MOM_001"),
  },
  TOX_001: {
    id: "TOX_001",
    blocks: [p("소변 검체를 보낸다."), voice("suspicion", "집에 수면제가 있다.", [flag("sleeping_pills_known")])],
    onEnter: [minutes(5), setFlag("tox_sent"), test(SIWOO, "tox_screen", "pending")],
    choices: [{ id: "return", label: "다른 것도 확인한다", next: "ER_004" }],
  },
  FLUIDS_001: {
    id: "FLUIDS_001",
    blocks: [p("수액이 들어간다. 삼십 분."), p("시우는 여전히 대답이 늦다."), thought("decision", "기다리는 것도 결정이다.", 3)],
    onEnter: [minutes(30), setFlag("observed_on_fluids")],
    choices: go("MOM_001"),
  },
};


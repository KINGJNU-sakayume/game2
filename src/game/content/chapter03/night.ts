import type { StoryNode } from "@/game/types";
import {
  SUNRYE, addDiagnosis, at, clue, clockTo, d, flag, go, herTrust, log, me, memoryVoice, minutes, not, p, primary, s, setFlag, setValue, stage, stamp, test, thought, voice, when,
} from "./helpers";

const NIGHT = at(3, 10) + 1440;
const differentials = ["scrub_typhus", "leptospirosis", "hfrs", "sfts", "dress", "urosepsis"];
const toCase = go("CASE_003", "가설을 다시 검토한다");
/** The nurse finds what the exam did not: the clue is never locked behind one roll. */
const nurseFindsEschar = [setFlag("eschar_found_by_nurse"), setFlag("bite_site_known"), clue("eschar"), log("eschar", "가피 발견 · 간호사", "clinical")];

export const nightNodes: Record<string, StoryNode> = {
  NIGHT_001: {
    id: "NIGHT_001",
    presentation: { assetId: "SCN3_001_ER_NIGHT", backdrop: "er-night", location: "응급실 11" },
    onEnter: [clockTo(NIGHT)],
    blocks: [stamp("03:10"), p("응급실의 새벽은 조용하지 않다. 조용해지는 건 환자 쪽이다.")],
    choices: [
      { id: "mild", label: "계속", conditions: [flag("early_doxy")], next: "DET_MILD" },
      { id: "severe", label: "계속", conditions: [flag("early_doxy", false)], next: "DET_SEVERE" },
    ],
  },
  DET_MILD: {
    id: "DET_MILD",
    presentation: { clinicalData: [{ label: "T", value: "38.6", tone: "warning" }, { label: "BP", value: "104/64" }, { label: "SpO2", value: "94%" }] },
    blocks: [
      p("열은 아직 38도대. 그래도 산소포화도가 더 떨어지지 않는다."),
      d("문순례", "“수경이는 집에 갔어?”"),
      thought("observation", "날짜는 몰라도, 딸이 어디 있는지는 안다.", 3),
      d("강수진", "“선생님, 가운 갈아입히다가 봤는데요. 가슴 밑에 딱지가 있어요.”", [flag("eschar_found", false)]),
    ],
    onEnter: [when([flag("eschar_found", false)], nurseFindsEschar)],
    choices: go("CASE_002", "정리한다"),
  },
  DET_SEVERE: {
    id: "DET_SEVERE",
    presentation: { assetId: "SCN3_001_ER_NIGHT", backdrop: "er-night", clinicalData: [{ label: "T", value: "39.8", tone: "critical" }, { label: "BP", value: "86/52", tone: "critical" }, { label: "SpO2", value: "88%", tone: "critical" }] },
    blocks: [
      p("산소포화도 88. 혈압 86에 52."),
      p("순례가 딸을 알아보지 못한다. 숨이 얕고 빠르다."),
      d("강수진", "“선생님, 가운 갈아입히다가 봤는데요. 가슴 밑에 딱지가 있어요.”", [flag("eschar_found", false)]),
      voice("observation", "처음부터 거기 있었다. 내가 보지 않았을 뿐.", [flag("eschar_found", false)]),
      p("스테로이드를 쓴 뒤 잠깐 내렸던 열이 다시 치솟는다.", [flag("steroid_given")]),
      d("윤재혁", "“중환자실 자리 하나 만들게요. 고유량 산소로 버텨보고, 안 되면 삽관입니다.”"),
    ],
    onEnter: [
      clue("shock_signs"), stage(SUNRYE, "critical"), log("deterioration", "저산소 · 저혈압 · 의식 악화", "clinical"),
      when([flag("eschar_found", false)], [...nurseFindsEschar, setValue("diagnosis_outcome", "late")]),
    ],
    choices: go("DET_AIRWAY", "순례와 이야기한다"),
  },
  DET_AIRWAY: {
    id: "DET_AIRWAY",
    presentation: { assetId: "SCN3_001_ER_NIGHT", backdrop: "er-night", clinicalData: [{ label: "BP", value: "88/54", tone: "critical" }, { label: "SpO2", value: "89%", tone: "critical" }] },
    blocks: [
      p("순례의 눈이 잠깐 맑아진다."),
      d("문순례", "“나… 기계 달고 사는 건 싫어.”"),
      d("이수경", "“엄마, 무슨 소리야. 선생님, 뭐든 해주세요.”"),
      thought("empathy", "지금은 그녀가 대답할 수 있는 몇 분이다.", 2),
    ],
    choices: [
      { id: "ask-her", label: "“며칠만 숨 쉬는 걸 도와드리는 거예요. 약이 듣는 병입니다. 괜찮으시겠어요?”", effects: [herTrust(6), setFlag("airway_consented")], next: "DET_AIRWAY_OK" },
      { id: "daughter", label: "따님과만 상의해 정한다", effects: [herTrust(-4)], next: "DET_AIRWAY_OK" },
      { id: "override", label: "설명 없이 삽관 준비를 시킨다", effects: [herTrust(-10), setFlag("overrode_wishes"), setFlag("dignity_breached")], next: "DET_AIRWAY_OK" },
    ],
  },
  DET_AIRWAY_OK: {
    id: "DET_AIRWAY_OK",
    title: "중환자실",
    presentation: { assetId: "SCN3_002_ICU_BAY", backdrop: "icu", location: "중환자실", titleStyle: "place", timeLabel: "04:20" },
    onEnter: [clockTo(NIGHT + 70)],
    blocks: [
      d("문순례", "“…며칠이면, 해.”", [flag("airway_consented")]),
      p("고유량 산소가 들어간다. 삽관 준비물은 침대 옆에 펼쳐진 채 기다린다."),
      p("순례가 무언가 말하려다 눈을 감는다.", [flag("overrode_wishes")]),
    ],
    choices: go("CASE_002", "정리한다"),
  },
  CASE_002: {
    id: "CASE_002",
    title: "증례 토의",
    presentation: { mode: "conference", titleStyle: "phase", titleCaption: "CASE CONFERENCE · 2", backdrop: "board" },
    blocks: [
      s("발열 6일 · 두통 · 근육통\n몸통 발진 · 림프절\n혈소판 86,000 · 간수치 상승\n간질성 폐렴\n세팔로스포린 무반응"),
      s("가피 · 왼쪽 가슴 아래"),
      s("추석 벌초 · 풀밭", [flag("grass_exposure_known")]),
      s("신속항체 음성 (6일째)", [flag("rdt_done")]),
      thought("history", "가을. 시골. 풀. 열. 그리고 딱지."),
      thought("reasoning", "가피가 있는 열은 이름이 몇 개 없다.", 2),
      thought("suspicion", "알로퓨리놀이 이 딱지까지 만들지는 않는다.", 3),
    ],
    onEnter: differentials.map((id) => addDiagnosis(SUNRYE, id)),
    choices: go("CASE_003", "가설을 세운다"),
  },
  CASE_003: {
    id: "CASE_003",
    title: "감별진단",
    presentation: { prompt: "가을의 열 가운데, 이 사람의 것은." },
    blocks: [],
    choices: [
      { id: "scrub", label: "쯔쯔가무시병", effects: primary("scrub_typhus"), next: "DX_SCRUB" },
      { id: "lepto", label: "렙토스피라증", effects: primary("leptospirosis"), next: "DX_LEPTO" },
      { id: "hfrs", label: "신증후군출혈열", effects: primary("hfrs"), next: "DX_HFRS" },
      { id: "sfts", label: "중증열성혈소판감소증후군 (SFTS)", effects: primary("sfts"), next: "DX_SFTS" },
      { id: "dress", label: "알로퓨리놀 과민반응 (DRESS)", effects: primary("dress"), next: "DX_DRESS" },
      { id: "uti", label: "요로패혈증", effects: primary("urosepsis"), next: "DX_UTI" },
    ],
  },
  DX_LEPTO: {
    id: "DX_LEPTO",
    blocks: [thought("reasoning", "비 온 뒤 논. 결막 충혈. 간수치. 맞는 게 많다."), thought("mechanism", "그런데 가피는 렙토스피라가 남기는 흔적이 아니다.")],
    onEnter: [minutes(5)],
    choices: toCase,
  },
  DX_HFRS: {
    id: "DX_HFRS",
    blocks: [thought("reasoning", "혈소판이 떨어졌고, 창고엔 쥐가 있었다."), thought("mechanism", "그런데 단백뇨가 없다. 신장은 아직 버틴다.\n그리고 딱지.")],
    onEnter: [minutes(5)],
    choices: toCase,
  },
  DX_SFTS: {
    id: "DX_SFTS",
    blocks: [
      thought("reasoning", "진드기, 혈소판, 간수치. 그리고 사람에게서 사람으로 옮는 병."),
      thought("mechanism", "그런데 백혈구가 버틴다. 그리고 딱지는 쯔쯔가무시 쪽이다."),
      s("SFTS 유전자검사 · 음성", [flag("sfts_sent")]),
    ],
    onEnter: [minutes(5), when([flag("sfts_sent")], [test(SUNRYE, "sfts_pcr", "negative"), clue("sfts_negative")])],
    choices: toCase,
  },
  DX_UTI: {
    id: "DX_UTI",
    blocks: [thought("reasoning", "노인의 열과 혼돈. 소변 백혈구. 흔한 조합이다."), thought("suspicion", "흔해서 먼저 떠오를 뿐, 이 사람의 것은 아니다.\n세팔로스포린을 사흘 먹고도 열이 그대로였다.", 3)],
    choices: [
      { id: "review", label: "가설을 다시 검토한다", next: "CASE_003" },
      { id: "anchor", label: "요로패혈증으로 밀고 간다", effects: [setFlag("diagnostic_anchoring")], next: "DX_ANCHOR" },
    ],
  },
  DX_DRESS: {
    id: "DX_DRESS",
    blocks: [thought("reasoning", "새 약, 발진, 열, 간수치, 림프절."), thought("mechanism", "호산구가 1%다. 얼굴이 붓지 않았다.\n그리고 약은 딱지를 만들지 않는다.")],
    choices: [
      { id: "review", label: "가설을 다시 검토한다", next: "CASE_003" },
      { id: "anchor", label: "약물 과민반응으로 밀고 간다", effects: [setFlag("diagnostic_anchoring"), setFlag("steroid_given")], next: "DX_ANCHOR" },
    ],
  },
  DX_ANCHOR: {
    id: "DX_ANCHOR",
    blocks: [p("차트에 가설을 적는다."), thought("suspicion", "적는 순간부터, 그 문장이 나 대신 생각하기 시작한다.", 2), memoryVoice("normal_is_not_diagnosis", "처음 쓴 문장이 마지막까지 살아남으면, 그건 진단이 아니라 습관이다.")],
    choices: [
      { id: "reconsider", label: "딱지를 다시 본다", next: "CASE_003" },
      { id: "commit", label: "이대로 중환자실에 넘긴다", conditions: [flag("diagnostic_anchoring")], next: "FAIL_001" },
    ],
  },
  DX_SCRUB: {
    id: "DX_SCRUB",
    blocks: [s("주진단 가설 · 쯔쯔가무시병"), thought("mechanism", "털진드기 유충이 문 자리. 세포 안에 사는 균.\n그래서 세팔로스포린이 닿지 않았다."), thought("reasoning", "그럼 약이 답해줄 거다.")],
    choices: [
      { id: "already", label: "이미 시작한 독시사이클린을 이어간다", conditions: [flag("early_doxy")], next: "TX_CONTINUE" },
      { id: "treat", label: "치료를 정한다", conditions: [flag("early_doxy", false)], next: "TX_001" },
    ],
  },
  TX_001: {
    id: "TX_001",
    title: "치료 결정",
    presentation: { prompt: "지금." },
    blocks: [thought("decision", "항체 결과는 일주일 뒤에나 제 말을 한다.", 2)],
    choices: [
      { id: "doxy-now", label: "독시사이클린을 지금 시작하고, 가피 PCR을 함께 보낸다", next: "TX_DOXY" },
      { id: "wait-ifa", label: "IFA 항체 결과를 확인한 뒤 시작한다", next: "TX_WAIT" },
      { id: "keep", label: "지금 쓰는 치료를 유지하며 지켜본다", next: "TX_KEEP" },
    ],
  },
  TX_DOXY: {
    id: "TX_DOXY",
    blocks: [me("“독시사이클린 들어가 주세요. 가피는 PCR로.”"), d("강수진", "“네.”"), p("새벽 네 시 반. 첫 용량.")],
    onEnter: [setFlag("doxy_started"), setValue("treatment_timing", "delayed"), log("doxy", "독시사이클린 시작", "decision"), test(SUNRYE, "eschar_pcr", "pending")],
    choices: go("FIELD_GATE", "아침을 기다린다"),
  },
  TX_WAIT: {
    id: "TX_WAIT",
    blocks: [p("하루가 지난다. 열은 40도를 넘는다."), d("윤재혁", "“삽관했습니다. 폐가 하얗게 찼어요.”"), thought("decision", "결과를 기다린 하루를 폐가 대신 냈다.")],
    onEnter: [minutes(1440), setFlag("doxy_started"), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), setFlag("intubated"), log("doxy", "독시사이클린 시작 (하루 지연)", "decision"), test(SUNRYE, "eschar_pcr", "pending")],
    choices: go("FIELD_GATE", "그다음 날 아침"),
  },
  TX_KEEP: {
    id: "TX_KEEP",
    blocks: [p("여섯 시간. 산소 요구량이 두 배가 된다."), d("윤재혁", "“이대로는 안 됩니다. 뭘 더 기다리는 거죠?”"), me("“…독시사이클린 시작하죠.”")],
    onEnter: [minutes(360), setFlag("doxy_started"), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), log("doxy", "독시사이클린 시작 (지연)", "decision"), test(SUNRYE, "eschar_pcr", "pending")],
    choices: go("FIELD_GATE", "아침을 기다린다"),
  },
  TX_CONTINUE: {
    id: "TX_CONTINUE",
    blocks: [p("여섯 시간째. 두 번째 용량이 들어간다."), thought("decision", "기다리는 것도 이번엔 치료다.", 2)],
    onEnter: [when([not(flag("eschar_pcr_sent"))], [test(SUNRYE, "eschar_pcr", "pending"), setFlag("eschar_pcr_sent")])],
    choices: go("FIELD_GATE", "아침을 기다린다"),
  },
};


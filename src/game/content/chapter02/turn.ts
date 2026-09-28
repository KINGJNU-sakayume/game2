import type { Condition, StoryNode } from "@/game/types";
import {
  HYEJIN, SIWOO, at, atLeast, addDiagnosis, clue, clockTo, d, flag, go, log, memoryVoice, minutes, momClue, momTrust, not, p, primary, s, setFlag, setValue, stage, test, thought, timeAtLeast, valueNot, voice, when,
} from "./helpers";

/** COHb requested after 09:35 means the clue trail was followed too slowly. */
const LATE_DIAGNOSIS_AT = at(9, 35);
const differentials = ["infectious_gastroenteritis", "meningoencephalitis", "co_poisoning", "ingestion", "stress_and_gastroenteritis", "metabolic"];
const toCase = go("CASE_003", "가설을 다시 검토한다");
const earlyOxygen: Condition = flag("o2_early");

export const turnNodes: Record<string, StoryNode> = {
  // ── ACT 2 · THE SECOND PATIENT ──────────────────────────────────────────
  MOM_001: {
    id: "MOM_001",
    presentation: { backdrop: "er", timeLabel: "08:52", location: "소아응급 대기실" },
    onEnter: [clockTo(at(8, 52)), momClue("caregiver_syncope"), setFlag("mother_collapsed"), stage(HYEJIN, "progressing"), log("mother-syncope", "보호자 실신", "clinical")],
    blocks: [
      p("복도 쪽에서 무언가 넘어지는 소리."),
      d("강수진", "“선생님! 보호자분이 쓰러졌어요!”"),
      p("혜진이 대기 의자 앞 바닥에 누워 있다. 눈은 떴지만 초점이 없다."),
      d("정혜진", "“…시우는요?”"),
    ],
    choices: go("MOM_002"),
  },
  MOM_002: {
    id: "MOM_002",
    presentation: { clinicalData: [{ label: "HR", value: "112", tone: "warning" }, { label: "BP", value: "104/68" }, { label: "SpO2", value: "98%" }] },
    blocks: [
      p("의식을 잃은 시간은 삼십 초 남짓.\n두통, 가슴 답답함. 심전도는 동성빈맥."),
      d("서지안", "“스트레스성 실신 같아요. 밤새 일하고, 애는 아프고.”"),
      thought("reasoning", "그럴 수 있다.", 2),
      thought("suspicion", "같은 날 아침에?", 3),
      voice("mechanism", "아이는 99. 엄마는 98.\n둘 다 정상인데 둘 다 쓰러진다.", [atLeast("mechanism", 3)]),
      memoryVoice("normal_is_not_diagnosis", "숫자가 정상이면, 질문을 바꿔.", [not(flag("cohb_ordered"))]),
    ],
    onEnter: [momClue("chest_tightness"), clue("normal_spo2"), test(HYEJIN, "troponin", "pending"), setFlag("caregiver_symptoms_known"), momClue("caregiver_headache")],
    choices: go("CASE_002", "두 사람을 함께 본다"),
  },
  CASE_002: {
    id: "CASE_002",
    title: "증례 토의",
    presentation: { mode: "conference", titleStyle: "phase", titleCaption: "CASE CONFERENCE · 2", backdrop: "board" },
    blocks: [
      s("구토 · 두통 (아이)\n혼돈 · 실조\n발열 없음\nSpO2 99% · 98%\n보호자 두통 · 실신"),
      s("침수된 반지하\n보일러 연속 가동\n닫힌 창문", [flag("home_heating_known")]),
      s("햄스터 폐사", [flag("hamster_known")]),
      s("뇌 CT 정상", [flag("head_ct_done")]),
      s("뇌척수액 정상", [flag("lp_done")]),
      thought("mechanism", "두 사람. 같은 방. 같은 시간.\n열도 없고, 염증도 없다."),
      thought("reasoning", "사람이 아니라 방이 아프다.", 3),
      voice("empathy", "보리.", [flag("hamster_known")]),
      thought("mechanism", "산소포화도는 헤모글로빈에 무엇이 붙었는지 모른다.", 4),
    ],
    onEnter: differentials.map((id) => addDiagnosis(SIWOO, id)),
    choices: go("CASE_003", "가설을 세운다"),
  },
  CASE_003: {
    id: "CASE_003",
    title: "감별진단",
    presentation: { prompt: "두 사람을 한 번에 설명하는 가설은." },
    blocks: [],
    choices: [
      { id: "co", label: "일산화탄소 중독", effects: primary("co_poisoning"), next: "DX_CO" },
      { id: "ge", label: "감염성 장염 · 침수 오염수", effects: primary("infectious_gastroenteritis"), next: "DX_GE" },
      { id: "mening", label: "뇌수막염 · 뇌염", effects: primary("meningoencephalitis"), next: "DX_MENING" },
      { id: "ingest", label: "약물 · 독성물질 섭취", effects: primary("ingestion"), next: "DX_INGEST" },
      { id: "stress", label: "보호자 과로 · 아이 장염 (각각)", effects: primary("stress_and_gastroenteritis"), next: "DX_STRESS" },
      { id: "metabolic", label: "저혈당 · 대사 이상", effects: primary("metabolic"), next: "DX_META" },
    ],
  },
  DX_GE: {
    id: "DX_GE",
    blocks: [thought("reasoning", "설사 한 번. 오염된 물. 그럴듯하다."), thought("suspicion", "그럼 엄마의 실신은?\n그리고 열은?")],
    onEnter: [minutes(5)],
    choices: toCase,
  },
  DX_MENING: {
    id: "DX_MENING",
    blocks: [
      thought("reasoning", "두통, 구토, 혼돈. 맞는다."),
      thought("mechanism", "열이 없다. 목이 부드럽다.\n그리고 환자가 두 명이다."),
      voice("reasoning", "척수액도 깨끗했다.", [flag("lp_done")]),
    ],
    onEnter: [minutes(5)],
    choices: toCase,
  },
  DX_INGEST: {
    id: "DX_INGEST",
    blocks: [
      voice("suspicion", "아이가 엄마 수면제를 먹었다면.", [flag("sleeping_pills_known")]),
      thought("reasoning", "그럼 엄마는 왜 쓰러졌지?"),
      s("소변 약물 선별검사 · 음성", [flag("tox_sent")]),
    ],
    onEnter: [minutes(5), when([flag("tox_sent")], [test(SIWOO, "tox_screen", "negative"), clue("tox_negative")])],
    choices: toCase,
  },
  DX_META: {
    id: "DX_META",
    blocks: [thought("reasoning", "혈당 98. 전해질 정상."), thought("mechanism", "대사는 멀쩡하다. 멀쩡하지 않은 건 공기다.", 4)],
    onEnter: [minutes(5)],
    choices: toCase,
  },
  DX_STRESS: {
    id: "DX_STRESS",
    blocks: [
      thought("reasoning", "두 사람이 따로 아프다고 보면\n전부 설명된다.\n…각각은."),
      thought("suspicion", "같은 날 아침, 같은 방에서 둘이 동시에.\n우연이 두 번이면 원인이다.", 3),
    ],
    choices: [
      { id: "review", label: "가설을 다시 검토한다", next: "CASE_003" },
      { id: "anchor", label: "이 설명을 유지한다", effects: [setFlag("diagnostic_anchoring")], next: "DX_STRESS_REVIEW" },
    ],
  },
  DX_STRESS_REVIEW: {
    id: "DX_STRESS_REVIEW",
    blocks: [d("서지안", "“그럼 아이는 수액 맞고 귀가, 어머님은 수면 부족으로 정리할까요?”"), thought("decision", "그 집으로 돌아가는 거다.", 3)],
    choices: [
      { id: "reconsider", label: "귀가 전에 한 번 더 검토한다", next: "CASE_003" },
      { id: "discharge", label: "두 사람을 귀가시킨다", conditions: [flag("diagnostic_anchoring")], next: "FAIL_001" },
    ],
  },
  DX_CO: {
    id: "DX_CO",
    blocks: [
      s("주진단 가설 · 일산화탄소 중독"),
      thought("mechanism", "일산화탄소는 헤모글로빈 자리를\n산소보다 이백 배 넘게 세게 붙잡는다."),
      thought("reasoning", "그럼 증명해."),
    ],
    choices: [
      { id: "result", label: "보낸 가스 결과를 확인한다", conditions: [flag("cohb_ordered")], next: "COHB_RESULT" },
      { id: "order", label: "정맥혈가스 · COHb를 보낸다", conditions: [flag("cohb_ordered", false)], next: "CO_TEST" },
    ],
  },
  CO_TEST: {
    id: "CO_TEST",
    blocks: [
      s("정맥혈가스 · co-oximetry\n박시우 · 정혜진 동시 채혈"),
      d("강수진", "“결과는 이십 분쯤이요.”"),
      thought("decision", "산소는 검사 결과를 기다리지 않는다."),
    ],
    onEnter: [
      setFlag("cohb_ordered"), test(SIWOO, "vbg_cohb", "pending"), test(HYEJIN, "vbg_cohb", "pending"), log("cohb-ordered", "COHb 의뢰", "test"),
      when([timeAtLeast(LATE_DIAGNOSIS_AT)], [setValue("diagnosis_outcome", "late")]),
    ],
    choices: [
      { id: "o2-now", label: "두 사람 모두 100% 산소를 지금 시작한다", effects: [setFlag("o2_early")], next: "O2_LATE_START" },
      { id: "o2-wait", label: "결과를 보고 산소를 결정한다", effects: [setFlag("o2_waited")], next: "O2_WAIT" },
    ],
  },
  O2_LATE_START: {
    id: "O2_LATE_START",
    blocks: [d("강수진", "“비재호흡 마스크 두 개요.”"), p("마스크 두 개. 침대 두 개.\n커튼 하나를 걷어 두 침대를 붙인다.")],
    onEnter: [log("o2-started", "100% 산소 시작 (두 사람)", "decision")],
    choices: go("COHB_RESULT", "결과를 기다린다"),
  },
  O2_WAIT: {
    id: "O2_WAIT",
    blocks: [p("이십 분."), d("강수진", "“선생님, 시우가 또 토해요.”"), p("시우가 이름을 불러도 대답하지 않는다."), thought("decision", "기다린 이십 분을\n시우의 뇌가 대신 냈다.")],
    onEnter: [minutes(20), stage(SIWOO, "critical")],
    choices: go("COHB_RESULT", "결과를 확인한다"),
  },
  COHB_RESULT: {
    id: "COHB_RESULT",
    title: "COHb 결과",
    blocks: [
      d("강수진", "“가스 결과 나왔습니다.”"),
      s("COHb · 박시우 23%\nCOHb · 정혜진 28%\n비흡연자 정상 < 3%"),
      thought("reasoning", "일산화탄소."),
      thought("mechanism", "피는 붉었고, 산소포화도는 99였다.\n기계는 거짓말을 하지 않았다. 질문이 틀렸을 뿐."),
      d("서지안", "“…장염이 아니었네요.”"),
      voice("decision", "산소가 벌써 들어가고 있다.", [earlyOxygen]),
    ],
    onEnter: [
      minutes(10),
      test(SIWOO, "vbg_cohb", "positive"), test(HYEJIN, "vbg_cohb", "positive"), clue("cohb_elevated"), setFlag("co_confirmed"),
      log("cohb-positive", "COHb 23% · 28%", "test"),
      when([valueNot("diagnosis_outcome", "late")], [setValue("diagnosis_outcome", "appropriate")]),
      when([flag("o2_early", false)], [log("o2-started", "100% 산소 시작 (두 사람)", "decision")]),
    ],
    choices: go("HBOT_001", "치료를 정한다"),
  },

  // ── ACT 3 · HYPERBARIC OXYGEN ───────────────────────────────────────────
  HBOT_001: {
    id: "HBOT_001",
    title: "고압산소",
    presentation: { assetId: "SCN2_003_CHAMBER", backdrop: "icu", location: "고압산소치료실", prompt: "누구를, 어디로." },
    blocks: [
      s("트로포닌 I · 정혜진 0.09 ng/mL · 경도 상승"),
      d("서지안", "“우리 챔버는 일인용 한 대예요. 다인용은 한강 건너 병원, 사십 분 거리고요.”"),
      thought("mechanism", "의식을 잃었던 사람. 심장이 다친 사람.\n걷다가 벽을 짚는 아이.\n둘 다 챔버가 필요하다."),
    ],
    onEnter: [test(HYEJIN, "troponin", "positive"), momClue("troponin_mild")],
    choices: [
      { id: "both", label: "두 사람 모두. 보호자는 우리 챔버, 아이는 다인용 챔버로 전원한다", next: "HBOT_CONSENT" },
      { id: "child-only", label: "아이만 챔버에 넣고, 보호자는 100% 산소를 유지한다", next: "HBOT_CHILD_ONLY" },
      { id: "mother-only", label: "보호자만 챔버에 넣고, 아이는 100% 산소를 유지한다", next: "HBOT_MOTHER_ONLY" },
      { id: "none", label: "두 사람 모두 정상압 산소로 충분하다", next: "HBOT_NONE" },
    ],
  },
  HBOT_CONSENT: {
    id: "HBOT_CONSENT",
    blocks: [d("정혜진", "“저는 됐어요. 애부터 해주세요.”"), d("정혜진", "“오늘 밤에 출근해야 돼요. 빠지면 잘려요.”")],
    choices: [
      { id: "persuade", label: "“시우가 깨어났을 때, 엄마가 기억을 잃은 채면 안 되잖아요.”", check: { id: "hbot-empathy", ability: "empathy", dc: 8 }, next: { success: "HBOT_BOTH", failure: "HBOT_REFUSED" } },
      { id: "insist", label: "“의식을 잃으셨고, 심장도 다쳤습니다. 지금 받으셔야 합니다.”", check: { id: "hbot-decision", ability: "decision", dc: 9 }, next: { success: "HBOT_BOTH", failure: "HBOT_REFUSED" } },
    ],
  },
  HBOT_BOTH: {
    id: "HBOT_BOTH",
    presentation: { assetId: "SCN2_003_CHAMBER", backdrop: "icu" },
    blocks: [
      d("정혜진", "“…시우 먼저 보내주세요. 가는 거 보고 들어갈게요.”"),
      p("구급차 문이 닫힌다. 혜진이 챔버의 둥근 창에 손바닥을 댄다."),
      d("강수진", "“두 시간이에요. 귀가 먹먹하면 침을 삼키세요.”"),
    ],
    onEnter: [
      setFlag("hbot_both"), momTrust(4), log("hbot", "고압산소치료 (두 사람)", "decision"),
      when([earlyOxygen], [setValue("treatment_timing", "appropriate")]),
      when([flag("o2_early", false)], [setValue("treatment_timing", "delayed")]),
    ],
    choices: go("FIELD_GATE", "그동안 할 일을 한다"),
  },
  HBOT_REFUSED: {
    id: "HBOT_REFUSED",
    blocks: [
      d("정혜진", "“애만 보내주세요. 저는 산소 마스크 쓰고 있을게요.”"),
      thought("empathy", "결정하는 사람은 그녀다.\n내 일은 결정을 대신하는 게 아니라, 충분히 알게 하는 것.", 2),
      p("시우를 태운 구급차가 떠난다. 혜진은 마스크를 쓴 채 창밖을 본다."),
    ],
    onEnter: [
      setFlag("mother_declined_hbot"), setFlag("hbot_child"), log("hbot", "고압산소치료 (아이) · 보호자 거절", "decision"),
      when([earlyOxygen], [setValue("treatment_timing", "appropriate")]),
      when([flag("o2_early", false)], [setValue("treatment_timing", "delayed")]),
    ],
    choices: go("FIELD_GATE", "그동안 할 일을 한다"),
  },
  HBOT_CHILD_ONLY: {
    id: "HBOT_CHILD_ONLY",
    blocks: [p("시우를 전원한다. 혜진은 100% 산소를 유지한다."), thought("mechanism", "의식을 잃었던 사람이 챔버 밖에 있다.", 3)],
    onEnter: [setFlag("hbot_child"), setValue("treatment_timing", "delayed"), log("hbot", "고압산소치료 (아이만)", "decision")],
    choices: go("FIELD_GATE", "그동안 할 일을 한다"),
  },
  HBOT_MOTHER_ONLY: {
    id: "HBOT_MOTHER_ONLY",
    blocks: [p("혜진이 챔버에 들어간다. 시우는 소아응급에서 100% 산소를 유지한다."), thought("mechanism", "벽을 짚던 아이가 챔버 밖에 있다.", 3)],
    onEnter: [setFlag("hbot_mother"), setValue("treatment_timing", "delayed"), log("hbot", "고압산소치료 (보호자만)", "decision")],
    choices: go("FIELD_GATE", "그동안 할 일을 한다"),
  },
  HBOT_NONE: {
    id: "HBOT_NONE",
    blocks: [p("두 사람 모두 정상압 산소를 유지한다.\n일산화탄소헤모글로빈은 천천히 떨어진다."), thought("decision", "숫자는 떨어진다.\n뇌가 입은 손상은 숫자에 나오지 않는다.", 3)],
    onEnter: [setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), log("no-hbot", "고압산소 없이 정상압 산소 유지", "decision")],
    choices: go("FIELD_GATE", "그동안 할 일을 한다"),
  },
};

export const chapter02Timing = { LATE_DIAGNOSIS_AT } as const;

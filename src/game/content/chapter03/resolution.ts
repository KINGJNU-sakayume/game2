import type { Condition, StoryNode } from "@/game/types";
import {
  SUNRYE, all, any, d, flag, go, herTrust, log, me, memoryVoice, minutes, not, note, p, s, setFlag, setValue, test, thought, trusts, valueIs, valueNot, voice, when,
} from "./helpers";

const dignityBroken: Condition = any(flag("exam_without_consent"), flag("overrode_wishes"));
const boundaryBroken: Condition = any(trusts("lt", 20), all(dignityBroken, flag("dignity_apology", false)));
const relationshipOkay: Condition = all(trusts("gte", 20), any(not(dignityBroken), flag("dignity_apology")));
/** Tracing the exposure means the grass it came from and the other person who sat on it. */
const exposureKnown: Condition = all(flag("grass_exposure_known"), flag("neighbor_warned"));
const exposureMissing: Condition = any(flag("grass_exposure_known", false), flag("neighbor_warned", false));
const successful: Condition = valueNot("diagnosis_outcome", "failed");
const delayed: Condition = any(valueIs("diagnosis_outcome", "late"), valueIs("treatment_timing", "delayed"), flag("treatment_delay_significant"));
const onTime: Condition = all(valueIs("treatment_timing", "appropriate"), valueNot("diagnosis_outcome", "late"));

export const resolutionNodes: Record<string, StoryNode> = {
  RESPONSE_001: {
    id: "RESPONSE_001",
    title: "서른여섯 시간",
    presentation: { backdrop: "ward", assetId: "SCN3_003_WARD_MORNING", location: "감염내과 병동", titleStyle: "place", hideTime: true },
    onEnter: [
      minutes(24 * 60),
      test(SUNRYE, "eschar_pcr", "positive"), setFlag("bite_site_known"), setFlag("eschar_pcr_sent"),
      when([valueNot("diagnosis_outcome", "late")], [setValue("diagnosis_outcome", "appropriate")]),
      log("defervescence", "해열 · 가피 PCR 양성", "test"),
    ],
    blocks: [
      p("독시사이클린을 시작하고 서른여섯 시간 만에 열이 내렸다.", [flag("treatment_delay_significant", false)]),
      p("열이 내리기까지 나흘이 걸렸다. 중환자실에서 닷새를 보냈다.", [flag("treatment_delay_significant")]),
      s("가피 PCR · Orientia tsutsugamushi 양성"),
      thought("reasoning", "약이 진단을 확인해 줬다.\n그리고 딱지가 이름을 댔다."),
      d("문순례", "“배고프다.”", [flag("treatment_delay_significant", false)]),
      d("이수경", "“엄마가 배고프대요.”", [flag("treatment_delay_significant", false)]),
    ],
    choices: go("DISCLOSE_001", "순례와 이야기한다"),
  },
  DISCLOSE_001: {
    id: "DISCLOSE_001",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, hideVitals: true, backdrop: "black" },
    blocks: [
      d("문순례", "“벌레 한 마리가 이랬다고?”"),
      me("“벌레라기보다, 벌레 새끼 한 마리요. 눈에 잘 안 보일 만큼 작은.”"),
      d("문순례", "“칠십 년을 그 산에 다녔어.”"),
    ],
    choices: [
      { id: "hidden", label: "“딱지가 옷 속, 아무도 안 보는 데 있었어요. 어머님 잘못이 아닙니다.”", effects: [herTrust(6), setFlag("validation_given")], next: "DISCLOSE_002" },
      { id: "prevent", label: "“내년엔 긴 소매 입고, 돗자리 깔고 앉으시면 됩니다.”", effects: [herTrust(2)], next: "DISCLOSE_002" },
      { id: "blame", label: "“풀밭에 그냥 앉으시면 안 됐어요.”", effects: [herTrust(-6)], next: "DISCLOSE_002" },
    ],
  },
  DISCLOSE_002: {
    id: "DISCLOSE_002",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, backdrop: "black" },
    blocks: [d("이수경", "“제가 추석에 하루만 더 있었으면… 엄마 혼자 거기서…”"), p("수경의 말끝이 흐려진다.")],
    choices: [
      { id: "brought-her", label: "“수경 씨가 모시고 왔으니까 여기까지 온 겁니다.”", effects: [herTrust(3), setFlag("daughter_supported")], next: "ETHICS_001" },
      { id: "plan", label: "“앞으로 가을엔 증상이 생기면 바로 벌초 얘기부터 하세요.”", effects: [herTrust(1)], next: "ETHICS_001" },
    ],
  },
  ETHICS_001: {
    id: "ETHICS_001",
    blocks: [],
    choices: [
      { id: "dignity", label: "그날 밤 일을 이야기한다", conditions: [dignityBroken], next: "ETHICS_DIGNITY" },
      { id: "plan", label: "퇴원 계획을 이야기한다", conditions: [not(dignityBroken)], next: "DISCHARGE_001" },
    ],
  },
  ETHICS_DIGNITY: {
    id: "ETHICS_DIGNITY",
    blocks: [
      d("문순례", "“그날 밤, 내 옷을 그냥 걷었지.”", [flag("exam_without_consent")]),
      d("문순례", "“내가 싫다고 했는데, 아무도 나한테 안 물었어.”", [flag("overrode_wishes")]),
      d("문순례", "“아픈 늙은이는 몸도 말도 제 것이 아닌가.”"),
    ],
    choices: [
      { id: "apologize", label: "“찾아야 할 게 있었어도, 먼저 여쭤봤어야 했습니다. 죄송합니다.”", effects: [herTrust(10), setFlag("dignity_apology")], next: "DISCHARGE_001" },
      { id: "justify", label: "“그땐 급했습니다. 덕분에 찾았고요.”", effects: [herTrust(-5)], next: "DISCHARGE_001" },
    ],
  },
  DISCHARGE_001: {
    id: "DISCHARGE_001",
    title: "퇴원",
    presentation: { backdrop: "ward", titleStyle: "place", location: "감염내과 병동", hideTime: true },
    onEnter: [minutes(4 * 1440)],
    blocks: [
      note("퇴원 안내 · 문순례\n\n독시사이클린 · 7일 끝까지\n풀밭엔 돗자리, 긴 소매, 바지 밑단은 양말 속\n다녀오면 바로 씻고 옷은 따로 빨 것\n열이 나면 '벌초 다녀왔다'고 먼저 말할 것\n알로퓨리놀 · 통풍 클리닉에서 다시 정하기"),
      note("재활 · 보행 훈련 2주", [flag("treatment_delay_significant")]),
      d("문순례", "“내년 추석엔 아들 말 들을게.”"),
    ],
    choices: go("EP_001"),
  },
  EP_001: {
    id: "EP_001",
    title: "2주 뒤",
    presentation: { titleStyle: "place", backdrop: "paper", hideTime: true, hideCase: true },
    onEnter: [minutes(10 * 1440), test(SUNRYE, "scrub_ifa", "positive"), log("ifa", "IFA 항체 4배 상승", "test")],
    blocks: [
      s("쯔쯔가무시 IFA\n입원 시 1:80 → 2주 뒤 1:1280 · 4배 이상 상승"),
      thought("mechanism", "두 주 늦게 도착한 확진. 환자는 그보다 먼저 나았다."),
      p("영자 할머니도 허리춤에 가피가 있었다. 독시사이클린 사흘 만에 열이 내렸다고 한다.", [flag("neighbor_warned")]),
      p("영자 할머니는 열흘째 열이 난다. 읍내 의원에서 다시 감기약을 받았다고 한다.", [flag("neighbor_warned", false), flag("neighbor_called")]),
    ],
    choices: go("EP_002"),
  },
  EP_002: {
    id: "EP_002",
    presentation: { backdrop: "paper", hideTime: true, hideCase: true },
    onEnter: [when([boundaryBroken], [setFlag("follow_up_lost")])],
    blocks: [
      note("이수경 · 메시지\n엄마가 선생님 주라고 햅쌀 보냈어요. 받으실 때까지 전화하신대요.", [trusts("gte", 60), not(flag("follow_up_lost"))]),
      p("외래 기록으로 경과를 확인한다.", [trusts("lt", 60), not(flag("follow_up_lost"))]),
      p("순례는 외래 예약을 읍내 병원으로 옮겼다.", [flag("follow_up_lost")]),
    ],
    choices: go("END_CALC", "기록을 정리한다"),
  },
  FAIL_001: {
    id: "FAIL_001",
    presentation: { backdrop: "icu", hideCase: true },
    blocks: [
      p("중환자실로 넘긴다. 차트 첫 줄에는 내가 쓴 가설이 적혀 있다."),
      p("스테로이드가 들어간다. 열이 이틀 잠잠하다가 다시 오른다. 폐가 하얗게 찬다.", [flag("steroid_given")]),
      p("다음 날 아침, 중환자실 간호사가 목욕을 시키다가 가피를 사진으로 찍어 올린다."),
      s("감염내과 회신\n가피 · 쯔쯔가무시병 강력 의심 · 독시사이클린 시작\n가피 PCR · Orientia tsutsugamushi 양성"),
      thought("reasoning", "보지 않은 곳은, 없는 곳이 아니다."),
    ],
    onEnter: [
      minutes(36 * 60), setValue("diagnosis_outcome", "failed"), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), setFlag("intubated"),
      setFlag("bite_site_known"), test(SUNRYE, "eschar_pcr", "positive"),
    ],
    choices: go("END_CALC", "기록을 정리한다"),
  },
  END_CALC: {
    id: "END_CALC",
    presentation: { prompt: "기록을 닫는다.", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [],
    choices: [
      { id: "failed", label: "기록을 마친다", conditions: [valueIs("diagnosis_outcome", "failed")], effects: [setValue("ending_id", "END_E")], next: "END_E" },
      { id: "delayed", label: "기록을 마친다", conditions: [successful, delayed], effects: [setValue("ending_id", "END_B")], next: "END_B" },
      { id: "broken", label: "기록을 마친다", conditions: [successful, onTime, boundaryBroken], effects: [setValue("ending_id", "END_C")], next: "END_C" },
      { id: "partial", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, exposureMissing], effects: [setValue("ending_id", "END_D")], next: "END_D" },
      { id: "complete", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, exposureKnown], effects: [setValue("ending_id", "END_A")], next: "END_A" },
    ],
  },

  // ── ENDINGS ─────────────────────────────────────────────────────────────
  END_A: {
    id: "END_A",
    title: "내년 추석",
    presentation: { titleStyle: "ending", titleCaption: "ENDING A", backdrop: "village", hideTime: true, hideCase: true },
    blocks: [
      p("이듬해 추석. 상월리 뒷산."),
      p("순례가 봉분 앞에 돗자리를 편다. 긴 소매. 장갑."),
      p("바지 밑단을 양말 속에 넣는다.\n올해는 잊지 않았다."),
      p("옆에서 영자가 똑같이 한다.", [flag("neighbor_warned")]),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_B: {
    id: "END_B",
    title: "늦게 본 곳",
    presentation: { titleStyle: "ending", titleCaption: "ENDING B", backdrop: "ward", hideTime: true, hideCase: true },
    blocks: [
      p("순례는 보행기를 밀며 병동 복도 끝까지 간다. 한 번 쉬고, 돌아온다."),
      p("가피는 처음부터 거기 있었다."),
      p("누군가 보기까지 하루가 걸렸고, 그 하루를 폐와 다리가 냈다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_C: {
    id: "END_C",
    title: "묻지 않은 손",
    presentation: { titleStyle: "ending", titleCaption: "ENDING C", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("순례는 다 나아서 상월리로 돌아갔다."),
      p("외래는 읍내 병원으로 옮겼다. 이 병원 이름은 다시 입에 올리지 않는다고 한다."),
      p("병은 옷 속에 있었다.\n옷을 걷기 전에 물었어야 했다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_D: {
    id: "END_D",
    title: "같은 풀밭",
    presentation: { titleStyle: "ending", titleCaption: "ENDING D", backdrop: "field", hideTime: true, hideCase: true },
    blocks: [
      p("영자 할머니는 읍내 병원 중환자실에서 가을을 보냈다.\n같은 날, 같은 풀밭이었다.", [flag("neighbor_warned", false)]),
      p("이듬해 추석. 순례는 같은 산소 앞 잔디에 앉는다.\n반팔. 맨손. 돗자리 없이.", [flag("grass_exposure_known", false)]),
      p("병의 이름은 알았다.\n그 병이 어디서 왔는지, 누구에게 또 왔는지는 끝까지 따라가지 않았다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_E: {
    id: "END_E",
    title: "감기약",
    presentation: { titleStyle: "ending", titleCaption: "ENDING E", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("중환자실 간호사가 찍은 사진 한 장이 진단을 바꿨다."),
      p("첫 기록에는 내가 쓴 문장이 그대로 남아 있다."),
      note("임상적 인상 · 요로패혈증 / 약물 과민반응 의증"),
      thought("reasoning", "보지 않은 곳은, 없는 곳이 아니다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  CASE_ARCHIVE: {
    id: "CASE_ARCHIVE",
    title: "사건 기록",
    presentation: { screen: "archive", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [],
    choices: go("REFLECTION", "돌아본다"),
  },
  REFLECTION: {
    id: "REFLECTION",
    title: "돌아보기",
    presentation: { screen: "reflection", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      thought("observation", "발진은 보여준 곳까지만 보았다.\n딱지는 보여주지 않은 곳에 있었다."),
      voice("empathy", "부끄러움을 건너뛰지 않고 물었다.", [flag("consented_exam")]),
      voice("empathy", "물어야 할 때 묻지 않았다.", [dignityBroken]),
      voice("history", "가을, 시골, 풀. 세 단어가 먼저 있었다.", [flag("grass_exposure_known")]),
      voice("decision", "항체보다 약이 먼저였다.", [flag("early_doxy")]),
      voice("suspicion", "요로감염이라는 말은 소변 한 줄에서 나왔다.", [valueIs("initial_anchor", "urosepsis")]),
      memoryVoice("normal_is_not_diagnosis", "음성도 정상도, 진단이 아니었다."),
      memoryVoice("patient_is_never_one", "같은 풀밭에 앉은 사람이 있었다.", [flag("neighbor_called")]),
    ],
    choices: go("CASE_COMPLETE", "기록을 보관한다"),
  },
  CASE_COMPLETE: {
    id: "CASE_COMPLETE",
    title: "사건 종결",
    presentation: { screen: "complete", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [],
    choices: [
      { id: "next", label: "다음 사건", action: "nextChapter" },
      { id: "archive", label: "사건 기록 다시 보기", next: "CASE_ARCHIVE" },
      { id: "title", label: "타이틀로", action: "title" },
      { id: "restart", label: "이 사건을 처음부터", action: "restart" },
    ],
  },
};

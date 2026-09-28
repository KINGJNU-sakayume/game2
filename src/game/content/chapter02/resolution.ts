import type { Condition, StoryNode } from "@/game/types";
import {
  HYEJIN, SIWOO, all, any, at, d, flag, go, log, me, memoryVoice, minutes, momTrust, not, note, p, s, setFlag, setValue, stamp, test, thought,
  trusts, valueIs, valueNot, voice, when,
} from "./helpers";

const boundaryBroken: Condition = any(trusts("lt", 20), all(flag("reported_without_consent"), flag("apology_given", false)));
const relationshipOkay: Condition = all(trusts("gte", 20), any(flag("reported_without_consent", false), flag("apology_given")));
const sourceKnown: Condition = all(flag("flue_found"), flag("ventilation_known"));
const sourceMissing: Condition = any(flag("flue_found", false), flag("ventilation_known", false));
const successful: Condition = valueNot("diagnosis_outcome", "failed");
const delayed: Condition = any(valueIs("diagnosis_outcome", "late"), valueIs("treatment_timing", "delayed"), flag("treatment_delay_significant"));
const onTime: Condition = all(valueIs("treatment_timing", "appropriate"), valueNot("diagnosis_outcome", "late"));
const childMissedChamber: Condition = all(flag("hbot_child", false), flag("hbot_both", false));

export const resolutionNodes: Record<string, StoryNode> = {
  // ── ACT 4 · AFTER THE CHAMBER ───────────────────────────────────────────
  AFTER_001: {
    id: "AFTER_001",
    title: "소아병동",
    presentation: { backdrop: "ward", assetId: "SCN2_004_WARD", location: "소아병동 5층", timeLabel: "13:10", titleStyle: "place" },
    onEnter: [{ type: "advanceToTime", value: at(13, 10) }],
    blocks: [
      p("시우가 침대 머리를 올린 채 앉아 있다. 눈이 맑다."),
      d("박시우", "“선생님. 보리는요?”"),
      p("혜진이 커튼 옆에서 숨을 멈춘다."),
    ],
    choices: [
      { id: "gentle", label: "“보리는 시우보다 몸이 작아서, 먼저 많이 아팠어.”", effects: [momTrust(3), setFlag("told_about_pet")], next: "AFTER_002" },
      { id: "defer", label: "혜진을 본다. “엄마랑 같이 이야기하자.”", effects: [momTrust(4)], next: "AFTER_002" },
      { id: "lie", label: "“보리는 괜찮아.”", effects: [momTrust(-4), setFlag("lied_about_pet")], next: "AFTER_002" },
    ],
  },
  AFTER_002: {
    id: "AFTER_002",
    blocks: [
      d("박시우", "“…보리가 나 대신 아팠던 거야?”", [flag("told_about_pet")]),
      p("혜진이 아이의 머리를 쓸어 넘긴다.", [flag("told_about_pet")]),
      d("박시우", "“응.”", [flag("lied_about_pet")]),
      voice("empathy", "이 거짓말은 오늘 밤 엄마가 대신 갚게 된다.", [flag("lied_about_pet")]),
      p("시우가 엄마를 보고 고개를 끄덕인다.", [not(flag("told_about_pet")), not(flag("lied_about_pet"))]),
    ],
    choices: go("DISCLOSE_001", "혜진과 이야기한다"),
  },
  DISCLOSE_001: {
    id: "DISCLOSE_001",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, hideVitals: true, backdrop: "black" },
    blocks: [
      d("정혜진", "“제가 보일러를 틀었어요.”"),
      d("정혜진", "“제가 창문을 닫았고요.”"),
      p("잠시 침묵."),
      d("정혜진", "“제가 애를 그 방에 재웠어요.”"),
    ],
    choices: [
      { id: "flue", label: "“배기통이 빠져 있었어요. 어머님이 볼 수 있는 곳이 아니었습니다.”", conditions: [flag("flue_found")], effects: [momTrust(8), setFlag("validation_given")], next: "DISCLOSE_002" },
      { id: "not-fault", label: "“어머님 잘못이 아닙니다.”", conditions: [flag("flue_found", false)], effects: [momTrust(3)], next: "DISCLOSE_002" },
      { id: "facts", label: "“밀폐된 방에서 연소가 일어나면 생기는 일입니다.”", effects: [momTrust(-2)], next: "DISCLOSE_002" },
      { id: "blame", label: "“창문만 열어뒀어도 괜찮았을 겁니다.”", effects: [momTrust(-8)], next: "DISCLOSE_002" },
    ],
  },
  DISCLOSE_002: {
    id: "DISCLOSE_002",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, backdrop: "black" },
    blocks: [
      d("정혜진", "“…그 집, 다시 못 들어가죠.”"),
      me("“보일러가 고쳐지기 전까지는요.”"),
      d("정혜진", "“그럼 오늘 어디서 자요. 애랑.”"),
    ],
    choices: go("SOCIAL_001", "사회복지팀을 부른다"),
  },
  SOCIAL_001: {
    id: "SOCIAL_001",
    presentation: { backdrop: "ward", location: "소아병동 상담실" },
    blocks: [
      d("문경희", "“의료사회복지팀 문경희입니다.”"),
      d("문경희", "“어머님이 야간 근무 중엔 시우가 집에 혼자 있었대요.”", [flag("child_alone_known")]),
      d("문경희", "“어머님 야간 근무 얘기는 들었어요. 그동안 시우는 어디 있었는지 여쭤봐야 할 것 같고요.”", [flag("child_alone_known", false)]),
    ],
    choices: [
      { id: "support", label: "“야간 돌봄이랑 긴급 주거 지원부터 연결해 주세요. 어머님 동의 받고요.”", effects: [momTrust(6), setFlag("social_support")], next: "SOCIAL_002" },
      { id: "report", label: "“이건 방임으로 신고해야 하는 것 아닙니까?”", next: "SOCIAL_REPORT" },
      { id: "lecture", label: "혜진에게 아이를 밤에 혼자 두면 안 된다고 말한다", effects: [momTrust(-6), setFlag("lectured")], next: "SOCIAL_002" },
    ],
  },
  SOCIAL_REPORT: {
    id: "SOCIAL_REPORT",
    blocks: [
      d("문경희", "“학대 정황이 있으면 당연히 신고하죠. 그런데 지금은 방임보다 돌봄 공백이에요.”"),
      d("문경희", "“어머님은 일을 하셨고, 맡길 데가 없었어요. 지원부터 붙이는 게 맞다고 봐요.”"),
      thought("reasoning", "절차가 할 수 있는 일과, 사람이 먼저 해야 하는 일.", 3),
    ],
    choices: [
      { id: "agree", label: "“그럼 지원부터 연결해 주세요.”", effects: [momTrust(2), setFlag("social_support")], next: "SOCIAL_002" },
      { id: "insist", label: "그래도 신고한다", effects: [momTrust(-20), setFlag("reported_without_consent")], next: "SOCIAL_002" },
    ],
  },
  SOCIAL_002: {
    id: "SOCIAL_002",
    blocks: [
      d("문경희", "“오늘 밤은 병원에서 주무시고, 내일 긴급 주거 쪽으로 알아볼게요. 야간 돌봄도 신청하고요.”", [flag("social_support")]),
      d("정혜진", "“…그런 게 있는 줄 몰랐어요.”", [flag("social_support")]),
      d("정혜진", "“알아요. 저도 알아요. 근데 방법이 없었어요.”", [flag("lectured")]),
      d("정혜진", "“신고요? 애 뺏어가려고요?”", [flag("reported_without_consent")]),
      p("혜진이 시우 쪽 커튼을 닫는다.", [flag("reported_without_consent")]),
    ],
    choices: [
      { id: "repair", label: "“겁주려던 게 아니었습니다. 제가 순서를 잘못 잡았어요. 미안합니다.”", conditions: [flag("reported_without_consent")], effects: [momTrust(10), setFlag("apology_given")], next: "DISCHARGE_001" },
      { id: "justify", label: "“아이 안전을 위한 절차입니다.”", conditions: [flag("reported_without_consent")], effects: [momTrust(-4)], next: "DISCHARGE_001" },
      ...go("DISCHARGE_001", "퇴원 계획을 세운다").map((choice) => ({ ...choice, conditions: [flag("reported_without_consent", false)] })),
    ],
  },
  DISCHARGE_001: {
    id: "DISCHARGE_001",
    title: "퇴원",
    presentation: { backdrop: "ward", titleStyle: "place", location: "소아병동 5층", hideTime: true },
    onEnter: [minutes(60 * 20)],
    blocks: [
      note("퇴원 안내 · 박시우 / 정혜진\n\n가스 점검이 끝나기 전엔 그 집에서 자지 않는다\n두통, 건망, 성격 변화가 생기면 바로 올 것\n4주 뒤 신경인지 검사\n일산화탄소 경보기 · 사회복지팀 지원"),
      note("노출원 · 보일러 배기통 이탈 · 가스안전공사 사용중지", [flag("flue_found")]),
      note("노출원 · 미확인 · 귀가 보류 권고", [flag("flue_found", false)]),
      d("박시우", "“경보기는 어디에 달아요?”"),
      me("“잠자는 방 가까이. 시우 머리보다 높게.”"),
    ],
    choices: go("EP_001"),
  },

  // ── ACT 5 · FOUR WEEKS LATER ────────────────────────────────────────────
  EP_001: {
    id: "EP_001",
    title: "4주 뒤",
    presentation: { titleStyle: "place", backdrop: "paper", hideTime: true, hideCase: true },
    onEnter: [
      minutes(28 * 1440),
      when([any(childMissedChamber, flag("treatment_delay_significant"), valueIs("diagnosis_outcome", "late"))], [setFlag("residual_dns"), test(SIWOO, "neurocog", "positive")]),
      when([not(flag("residual_dns"))], [test(SIWOO, "neurocog", "negative")]),
      log("follow-up", "4주 추적 · 신경인지 검사", "clinical", at(9, 30) + 28 * 1440),
    ],
    blocks: [
      s("신경인지 선별검사 · 박시우 · 정상 범위", [not(flag("residual_dns"))]),
      d("박시우", "“구구단 칠단 외웠어요.”", [not(flag("residual_dns"))]),
      s("신경인지 선별검사 · 박시우 · 기억력 · 주의력 저하", [flag("residual_dns")]),
      d("정혜진", "“요즘 애가 자꾸 까먹어요. 방금 한 말을.”", [flag("residual_dns")]),
      p("혜진은 두통이 아직 가끔 온다고 한다. 챔버에 들어가지 않은 날을 생각한다고.", [flag("mother_declined_hbot")]),
    ],
    choices: go("EP_002"),
  },
  EP_002: {
    id: "EP_002",
    presentation: { backdrop: "paper", hideTime: true, hideCase: true },
    onEnter: [when([boundaryBroken], [setFlag("follow_up_lost")])],
    blocks: [
      note("정혜진 · 메시지\n선생님, 3층이에요. 창문 열면 하늘이 보여요.", [trusts("gte", 60), not(flag("follow_up_lost")), flag("social_support")]),
      p("외래 기록으로 두 사람의 경과를 확인한다.", [not(flag("follow_up_lost")), any(trusts("lt", 60), flag("social_support", false))]),
      p("혜진은 병원 전화를 받지 않는다.", [flag("follow_up_lost")]),
    ],
    choices: go("END_CALC", "기록을 정리한다"),
  },

  FAIL_001: {
    id: "FAIL_001",
    presentation: { backdrop: "phone", hideCase: true, timeLabel: "23:12" },
    blocks: [
      p("시우는 수액을 맞고, 혜진은 수면 부족으로 정리되어 집으로 돌아간다."),
      stamp("23:12"),
      p("그날 밤 열한 시, 1층 할머니가 119에 신고한다. 아래층에서 아무 소리가 안 난다고."),
      s("타 병원 회신\nCOHb · 박시우 31% · 정혜진 35%\n고압산소치료 시행"),
      thought("reasoning", "정상은 진단이 아니다."),
    ],
    onEnter: [
      minutes(14 * 60),
      setValue("diagnosis_outcome", "failed"), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), setFlag("residual_dns"),
      test(SIWOO, "vbg_cohb", "positive"), test(HYEJIN, "vbg_cohb", "positive"),
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
      { id: "partial", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, sourceMissing], effects: [setValue("ending_id", "END_D")], next: "END_D" },
      { id: "complete", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, sourceKnown], effects: [setValue("ending_id", "END_A")], next: "END_A" },
    ],
  },

  // ── ENDINGS ─────────────────────────────────────────────────────────────
  END_A: {
    id: "END_A",
    title: "하늘이 보이는 창",
    presentation: { titleStyle: "ending", titleCaption: "ENDING A", backdrop: "dawn", hideTime: true, hideCase: true },
    blocks: [
      p("석 달 뒤. 사회복지팀이 연결한 임대주택, 3층."),
      p("시우가 창틀에 턱을 괴고 있다."),
      p("이번 집 창문으로는 발목 대신 하늘이 보인다."),
      p("1층 할머니 집에도 경보기가 달렸다고 한다.", [flag("neighbor_warned")]),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_B: {
    id: "END_B",
    title: "늦게 열린 창",
    presentation: { titleStyle: "ending", titleCaption: "ENDING B", backdrop: "ward", hideTime: true, hideCase: true },
    blocks: [
      p("시우는 매주 목요일 인지 재활을 받는다."),
      d("박시우", "“선생님, 아까 뭐라고 했죠?”"),
      p("원인은 찾았다. 산소는 조금 늦었다."),
      p("일산화탄소는 몇 주 뒤에도 흔적을 남긴다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_C: {
    id: "END_C",
    title: "닫힌 문",
    presentation: { titleStyle: "ending", titleCaption: "ENDING C", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("사회복지팀의 문자에는 읽음 표시만 남는다."),
      p("외래 예약 두 번, 모두 부재."),
      p("병을 찾았고, 집을 찾았다.\n그 집에 사는 사람은 놓쳤다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_D: {
    id: "END_D",
    title: "원인 없는 퇴원",
    presentation: { titleStyle: "ending", titleCaption: "ENDING D", backdrop: "rain", hideTime: true, hideCase: true },
    blocks: [
      p("퇴원 나흘 뒤 새벽, 같은 주소에서 119 신고가 들어온다."),
      p("신고한 사람은 1층 할머니다. 이번엔 할머니 자신이 쓰러졌다."),
      p("병의 이름은 알았다.\n그 병이 어디서 오는지는 끝내 확인하지 않았다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_E: {
    id: "END_E",
    title: "정상 산소포화도",
    presentation: { titleStyle: "ending", titleCaption: "ENDING E", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("다른 병원의 회신이 도착한다. 두 사람 모두 고압산소치료."),
      p("첫 기록에는 내가 쓴 문장이 그대로 남아 있다."),
      note("임상적 인상 · 급성 장염 / 보호자 과로성 실신\nSpO2 99%"),
      thought("mechanism", "산소포화도는 무엇이 붙었는지 묻지 않는다."),
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
      thought("mechanism", "산소포화도는 무엇이 붙었는지 묻지 않는다."),
      thought("reasoning", "사람이 아니라 방이 아팠다."),
      voice("empathy", "엄마는 끝까지 자기 두통을 말하지 않으려 했다.", [flag("caregiver_symptoms_known")]),
      voice("observation", "케이지는 처음부터 현관 옆에 있었다.", [flag("hamster_known")]),
      voice("suspicion", "장염이라는 말은 어제 다른 의사가 쓴 문장이었다.", [valueIs("initial_anchor", "gastroenteritis")]),
      voice("decision", "산소는 결과를 기다리지 않았다.", [flag("o2_early")]),
      voice("decision", "산소가 결과를 기다렸다.", [flag("o2_waited")]),
      voice("history", "집을 떠나면 나아지는 병이었다.", [flag("called_center")]),
      memoryVoice("normal_is_not_diagnosis", "정상 CT, 정상 혈당, 정상 산소포화도.\n세 번 들었다."),
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

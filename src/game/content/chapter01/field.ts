import type { Condition, Effect, StoryNode } from "@/game/types";
import {
  HARIN, addValue, atLeast, clue, d, flag, go, harinTrust, me, minutes, p, s, setFlag, test, thought, trusts, valueAtLeast, valueBelow, voice, when,
} from "./helpers";

const incrementLocation: Effect[] = [addValue("field_locations_visited", 1)];
const available = (key: string): Condition[] => [flag(key, false)];
const mark = (key: string): Effect => setFlag(key);
const returnChoice = (id: string, label: string, destination: string, extra: Condition[] = []) => ({
  id, label, conditions: [...extra, valueBelow("field_locations_visited", 2)], next: destination,
});
const overstayChoice = (id: string, label: string, destination: string, extra: Condition[] = []) => ({
  id: `${id}-overstay`, label, conditions: [...extra, valueAtLeast("field_locations_visited", 2)],
  effects: [{ type: "value" as const, key: "field_overstay_destination", value: destination }], next: `FIELD_OVERSTAY_${destination}`,
});
const overstay = (id: string, label: string, destination: string, returnLabel = "병원으로 돌아간다"): StoryNode => ({
  id,
  blocks: [thought("decision", "환자는 병원에 있다.\n\n정보가 더 필요한가,\n네가 더 필요한가?")],
  choices: [
    { id: "continue-overstay", label, effects: [setFlag("field_overstay"), minutes(15)], next: destination },
    { id: "return", label: returnLabel, next: "DET_001" },
  ],
});
const extraResult = (id: string, blocks: StoryNode["blocks"], onEnter: Effect[] = []): StoryNode => ({
  id, blocks, onEnter: [minutes(4), ...onEnter], choices: [{ id: "return", label: "다른 것도 확인한다", next: "HOSP_EXTRA_001" }],
});

export const fieldNodes: Record<string, StoryNode> = {
  FIELD_GATE: {
    id: "FIELD_GATE",
    title: "현장 조사",
    presentation: { timeLabel: "22:08", titleStyle: "phase", titleCaption: "FIELD INVESTIGATION", prompt: "어디를 확인할까." },
    onEnter: [{ type: "advanceToTime", value: 1328 }, { type: "timeline", entry: { id: "field-start", kind: "field", text: "현장 조사 시작" } }],
    blocks: [
      me("“집이나 연습실에서 최근 달라진 걸 확인하고 싶습니다.”", [flag("field_gate_briefed", false)]),
      d("윤하린", "“집까지요?”", [flag("field_gate_briefed", false)]),
      me("“약, 음식, 환경 노출 같은 걸 직접 보고 싶습니다.”", [flag("field_gate_briefed", false)]),
      d("윤하린", "“세영이한테 연락하세요. 비밀번호도 알려줄게요.”", [flag("field_gate_briefed", false), trusts("gte", 55)]),
      d("윤하린", "“엄마한테는 아직 말하지 마세요.”", [flag("field_gate_briefed", false), trusts("gte", 55)]),
      d("윤하린", "“연습실은 괜찮아요. 집은 세영이랑 같이 가세요.”", [flag("field_gate_briefed", false), trusts("gte", 30), trusts("lt", 55)]),
      d("윤하린", "“싫어요.”", [flag("field_gate_briefed", false), trusts("lt", 30)]),
    ],
    onExit: [
      when([trusts("gte", 55), flag("field_gate_briefed", false)], [setFlag("family_privacy_requested")]),
      setFlag("field_gate_briefed"),
    ],
    choices: [
      returnChoice("apartment", "하린의 집을 조사한다", "APT_001", [trusts("gte", 30), ...available("visited_apartment")]),
      overstayChoice("apartment", "하린의 집을 조사한다", "APT_001", [trusts("gte", 30), ...available("visited_apartment")]),
      returnChoice("rehearsal", "연습실을 조사한다", "REH_001", available("visited_rehearsal")),
      overstayChoice("rehearsal", "연습실을 조사한다", "REH_001", available("visited_rehearsal")),
      returnChoice("family", "가족에게 확인한다", "FAM_001", available("contacted_family")),
      overstayChoice("family", "가족에게 확인한다", "FAM_001", available("contacted_family")),
      returnChoice("hospital", "병원에 남아 추가 검사를 한다", "HOSP_EXTRA_001", available("hospital_extra_complete")),
      overstayChoice("hospital", "병원에 남아 추가 검사를 한다", "HOSP_EXTRA_001", available("hospital_extra_complete")),
      { id: "return-hospital", label: "조사를 마치고 환자에게 돌아간다", next: "DET_001" },
    ],
  },
  FIELD_OVERSTAY_APT_001: overstay("FIELD_OVERSTAY_APT_001", "그래도 집을 조사한다", "APT_001"),
  FIELD_OVERSTAY_REH_001: overstay("FIELD_OVERSTAY_REH_001", "그래도 연습실을 조사한다", "REH_001"),
  FIELD_OVERSTAY_FAM_001: overstay("FIELD_OVERSTAY_FAM_001", "그래도 가족에게 연락한다", "FAM_001"),
  FIELD_OVERSTAY_HOSP_EXTRA_001: overstay("FIELD_OVERSTAY_HOSP_EXTRA_001", "그래도 추가 검사를 한다", "HOSP_EXTRA_001", "환자에게 돌아간다"),

  // ── 하린의 집 ───────────────────────────────────────────────────────────
  APT_001: {
    id: "APT_001",
    title: "윤하린의 원룸",
    presentation: {
      assetId: "SCN_003_APARTMENT", location: "윤하린의 원룸", titleStyle: "place", prompt: "어디부터 볼까.",
      hotspots: [
        { id: "apartment-fridge", label: "냉장고 조사", x: 5, y: 60, width: 9, height: 34, choiceId: "fridge", icon: "object" },
        { id: "apartment-vanity", label: "화장대 조사", x: 22, y: 37, width: 10, height: 18, choiceId: "vanity", icon: "inspect" },
        { id: "apartment-desk", label: "책상과 체중 기록 조사", x: 27, y: 50, width: 10, height: 10, choiceId: "desk", icon: "inspect" },
      ],
    },
    blocks: [p("윤하린의 작은 원룸.\n\n정돈되어 있지만 생활 흔적은 있다.", [flag("apt_intro_done", false)])],
    onExit: [setFlag("apt_intro_done")],
    choices: [
      { id: "fridge", label: "냉장고를 연다", conditions: available("apt_fridge_complete"), next: "APT_FRIDGE" },
      { id: "vanity", label: "화장대를 살핀다", conditions: available("apt_vanity_complete"), next: "APT_VANITY" },
      { id: "desk", label: "책상을 확인한다", conditions: available("apt_desk_complete"), next: "APT_DESK" },
      { id: "exit", label: "집 조사를 마친다", next: "APT_EXIT" },
    ],
  },
  APT_FRIDGE: {
    id: "APT_FRIDGE",
    presentation: { assetId: "EVD_002_FRIDGE" },
    blocks: [
      p("냉장고 안."),
      p("탄산수.\n저지방 요거트 두 개.\n달걀.\n병커피."),
      p("제대로 된 식사 재료가 거의 없다."),
      thought("observation", "며칠 비운 냉장고가 아니다.", 2),
      thought("mechanism", "탄수화물이 거의 없다.", 3),
    ],
    onEnter: [minutes(6), mark("apt_fridge_complete"), setFlag("restricted_diet_known"), clue("severe_caloric_restriction")],
    choices: go("APT_001", "방 안을 더 둘러본다"),
  },
  APT_VANITY: {
    id: "APT_VANITY",
    presentation: { assetId: "EVD_004_OCP" },
    blocks: [
      p("화장대.\n\n화장품.\n비타민.\n진통제.\n\n그리고 작은 약 포장."),
      p("경구피임약 blister pack.", [{ type: "any", conditions: [atLeast("observation", 3), atLeast("suspicion", 3)] }]),
      voice("mechanism", "호르몬.", [atLeast("mechanism", 4), flag("ocp_known")]),
      voice("mechanism", "저열량.\n\n둘을 같이 기억해.", [atLeast("mechanism", 4), flag("ocp_known"), flag("restricted_diet_known")]),
    ],
    onEnter: [
      minutes(8), mark("apt_vanity_complete"),
      when([{ type: "any", conditions: [atLeast("observation", 3), atLeast("suspicion", 3)] }], [setFlag("ocp_known"), clue("recent_hormonal_medication")]),
    ],
    choices: go("APT_001", "방 안을 더 둘러본다"),
  },
  APT_DESK: {
    id: "APT_DESK",
    presentation: { assetId: "EVD_003_WEIGHT_NOTEBOOK" },
    blocks: [p("체중 변화가 적힌 수첩."), thought("observation", "짧은 시간이다."), thought("empathy", "‘조금 줄였다’는 말과\n이 숫자는 다르다.", 3)],
    onEnter: [minutes(5), mark("apt_desk_complete"), setFlag("restricted_diet_known"), clue("rapid_weight_loss")],
    choices: go("APT_001", "방 안을 더 둘러본다"),
  },
  APT_EXIT: {
    id: "APT_EXIT",
    blocks: [
      { ...thought("reasoning", "발작 직전에 달라진 것들이 있다.\n\n식사.\n\n호르몬."), conditions: [flag("restricted_diet_known"), flag("ocp_known")] },
      p("현관 센서등이 꺼진다.", [{ type: "any", conditions: [flag("restricted_diet_known", false), flag("ocp_known", false)] }]),
    ],
    onEnter: [setFlag("visited_apartment"), ...incrementLocation],
    choices: go("FIELD_RETURN"),
  },

  // ── 연습실 ──────────────────────────────────────────────────────────────
  REH_001: {
    id: "REH_001",
    title: "밤의 연습실",
    presentation: {
      assetId: "SCN_004_REHEARSAL_EMPTY", location: "연습실", titleStyle: "place", prompt: "세영에게 무엇을 물을까.",
      hotspots: [
        { id: "rehearsal-bottle-bag", label: "물병과 가방 주변 조사", x: 78, y: 54, width: 14, height: 14, choiceId: "motor", icon: "object" },
        { id: "rehearsal-old-wall", label: "오래된 벽과 공사 흔적 조사", x: 8, y: 40, width: 14, height: 24, choiceId: "environment", icon: "environment" },
      ],
    },
    blocks: [
      p("밤의 텅 빈 연습실.\n정세영이 기다리고 있다.", [flag("reh_intro_done", false)]),
      d("정세영", "“뭐가 문제래요?”", [flag("reh_intro_done", false)]),
      me("“아직 찾는 중입니다.”", [flag("reh_intro_done", false)]),
      d("정세영", "“역시.”", [flag("reh_intro_done", false)]),
    ],
    onExit: [setFlag("reh_intro_done")],
    choices: [
      { id: "previous", label: "“역시?”", conditions: available("reh_prev_complete"), next: "REH_PREV" },
      { id: "diet", label: "최근 식사 상태를 묻는다", conditions: available("reh_diet_complete"), next: "REH_DIET" },
      { id: "motor", label: "최근 힘이 빠지거나 이상했던 일이 있었는지 묻는다", conditions: available("reh_motor_complete"), next: "REH_MOTOR" },
      { id: "environment", label: "연습실 환경을 확인한다", conditions: available("reh_env_complete"), next: "REH_ENV" },
      {
        id: "ocp", label: "최근 새로 먹기 시작한 약이 있었는지 묻는다",
        conditions: [flag("reh_ocp_complete", false), { type: "any", conditions: [atLeast("empathy", 4), flag("restricted_diet_known"), flag("medication_incomplete")] }],
        next: "REH_OCP",
      },
      { id: "exit", label: "연습실 조사를 마친다", next: "REH_EXIT" },
    ],
  },
  REH_PREV: {
    id: "REH_PREV",
    blocks: [d("정세영", "“작년에도 비슷했어요.\n\n배 아프다고 하고.\n\n잠 못 자고.\n\n되게 예민해지고.”")],
    onEnter: [mark("reh_prev_complete"), setFlag("previous_attacks_known"), clue("previous_attacks")],
    choices: go("REH_001", "다른 것도 묻는다"),
  },
  REH_DIET: {
    id: "REH_DIET",
    blocks: [
      d("정세영", "“요즘 거의 안 먹었어요.\n커피만 마시는 날도 있었고.”"),
      me("“누가 체중 감량을 요구했습니까?”"),
      d("정세영", "“아뇨. 그렇게 단순한 건 아니에요.\n이번 공연 끝나면 중요한 오디션이 있어서…”"),
      thought("empathy", "강요받지 않았다는 것과\n압박이 없었다는 것은 다른 말이다.", 3),
    ],
    onEnter: [mark("reh_diet_complete"), setFlag("restricted_diet_known"), clue("severe_caloric_restriction")],
    choices: go("REH_001", "다른 것도 묻는다"),
  },
  REH_MOTOR: {
    id: "REH_MOTOR",
    presentation: { assetId: "EVD_005_WATER_BOTTLE" },
    blocks: [d("정세영", "“아. 며칠 전에 물병을 못 열었어요.”"), me("“왜요?”"), d("정세영", "“손에 힘이 안 들어간다고.”"), thought("reasoning", "복통보다 먼저.")],
    onEnter: [mark("reh_motor_complete"), setFlag("early_weakness_known"), clue("preexisting_motor_weakness")],
    choices: go("REH_001", "다른 것도 묻는다"),
  },
  REH_ENV: {
    id: "REH_ENV",
    blocks: [p("낡은 연습실 한쪽 벽에 공사 흔적이 있다."), thought("suspicion", "오래된 페인트.", 3), thought("mechanism", "납?", 3)],
    onEnter: [
      mark("reh_env_complete"),
      when([atLeast("mechanism", 3)], [setFlag("lead_poisoning_available"), { type: "diagnosis", patientId: HARIN, diagnosisId: "lead_poisoning" }]),
    ],
    choices: go("REH_001", "다른 것도 묻는다"),
  },
  REH_OCP: {
    id: "REH_OCP",
    blocks: [d("정세영", "“아, 그리고…\n하린이가 저한테 피임약 물어봤어요.\n생리 미루려고.\n열흘 정도 됐나.”")],
    onEnter: [mark("reh_ocp_complete"), setFlag("ocp_known"), clue("recent_hormonal_medication")],
    choices: go("REH_001", "다른 것도 묻는다"),
  },
  REH_EXIT: {
    id: "REH_EXIT",
    blocks: [d("정세영", "“하린이 괜찮은 거죠?”"), p("대답 대신 연습실 불을 끈다.")],
    onEnter: [setFlag("visited_rehearsal"), ...incrementLocation],
    choices: go("FIELD_RETURN"),
  },

  // ── 가족 ────────────────────────────────────────────────────────────────
  FAM_001: {
    id: "FAM_001",
    presentation: { prompt: "연락할까." },
    blocks: [
      p("아까 하린이 한 말이 남아 있다.", [flag("family_privacy_requested")]),
      d("윤하린", "“엄마한테는 아직 말하지 마세요.”", [flag("family_privacy_requested")]),
      p("차트 보호자란에 어머니 번호가 적혀 있다.", [flag("family_privacy_requested", false)]),
    ],
    choices: [
      { id: "contact", label: "하린에게 묻지 않고 바로 연락한다", conditions: [flag("family_privacy_requested", false)], effects: [setFlag("family_boundary_broken"), harinTrust(-15)], next: "FAM_002" },
      { id: "contact-against-wish", label: "그래도 연락한다", conditions: [flag("family_privacy_requested")], effects: [setFlag("family_boundary_broken"), harinTrust(-15)], next: "FAM_002" },
      { id: "permission", label: "하린에게 먼저 허락을 구한다", next: "FAM_PERMISSION" },
      { id: "decline", label: "연락하지 않는다", next: "FIELD_RETURN" },
    ],
  },
  FAM_PERMISSION: {
    id: "FAM_PERMISSION",
    blocks: [d("윤하린", "“꼭 필요해요?”")],
    choices: [
      { id: "explain", label: "“가족 중에 비슷한 분이 있다면 진단이 빨라질 수 있습니다.”", check: { id: "family-empathy", ability: "empathy", dc: 8 }, next: { success: "FAM_PERMISSION_OK", failure: "FAM_PERMISSION_DELAY" } },
      { id: "insist", label: "“의학적으로 꼭 필요합니다.”", check: { id: "family-decision", ability: "decision", dc: 9 }, next: { success: "FAM_PERMISSION_INSIST", failure: "FAM_PERMISSION_DELAY" } },
      { id: "not-now", label: "지금은 연락하지 않는다", next: "FIELD_RETURN" },
    ],
  },
  FAM_PERMISSION_OK: {
    id: "FAM_PERMISSION_OK",
    blocks: [d("윤하린", "“…제가 먼저 말하면 안 돼요?”"), me("“그렇게 하셔도 됩니다.”"), p("십 분 뒤, 모르는 번호로 전화가 온다.")],
    onEnter: [harinTrust(3)],
    choices: go("FAM_002", "전화를 받는다"),
  },
  FAM_PERMISSION_INSIST: { id: "FAM_PERMISSION_INSIST", blocks: [d("윤하린", "“…알겠어요.”"), p("하린이 벽 쪽으로 돌아눕는다.")], onEnter: [harinTrust(-2)], choices: go("FAM_002", "어머니에게 전화한다") },
  FAM_PERMISSION_DELAY: {
    id: "FAM_PERMISSION_DELAY",
    blocks: [d("윤하린", "“지금은 싫어요.”"), thought("empathy", "‘지금은’이라고 했다.\n영원히 싫다는 말은 아니다.")],
    choices: [
      { id: "return", label: "지금은 연락하지 않는다", next: "FIELD_RETURN" },
      { id: "contact-anyway", label: "그래도 가족에게 연락한다", effects: [setFlag("family_boundary_broken"), harinTrust(-15)], next: "FAM_002" },
    ],
  },
  FAM_002: {
    id: "FAM_002",
    presentation: { backdrop: "phone" },
    blocks: [
      d("윤미정", "“하린이가 또 병원 갔어요?”"),
      thought("history", "또.", 3),
      me("“가족 중에 반복적으로 심한 복통을 겪은 분이 있습니까?”"),
      d("윤미정", "“없어요.”"),
      thought("suspicion", "너무 빨랐다.", 3),
    ],
    choices: go("FAM_003"),
  },
  FAM_003: {
    id: "FAM_003",
    blocks: [
      me("“복통과 함께 불면, 이상행동, 손발 힘 빠짐 같은 증상은요?”"),
      p("침묵."),
      d("윤미정", "“제 동생이 좀 그랬어요.\n젊을 때 배가 자주 아팠고.\n검사하면 아무것도 안 나온다고…\n한 번은 손에 힘이 빠져 입원했고.\n정신과에도 갔어요.”"),
      thought("mechanism", "복부.\n정신.\n운동신경.\n반복성."),
      thought("reasoning", "그리고 한 가족."),
    ],
    onEnter: [setFlag("family_history_known"), clue("maternal_family_recurrent_neurovisceral_attacks")],
    choices: go("FAM_004"),
  },
  FAM_004: {
    id: "FAM_004",
    blocks: [me("“요즘도 그러십니까?”"), d("윤미정", "“아뇨. 마흔 넘고는 거의 못 들었어요.”"), thought("mechanism", "…", 5)],
    onEnter: [setFlag("contacted_family"), ...incrementLocation],
    choices: go("FIELD_RETURN"),
  },

  // ── 병원 추가 검사 ──────────────────────────────────────────────────────
  HOSP_EXTRA_001: {
    id: "HOSP_EXTRA_001",
    presentation: { prompt: "무엇을 더 확인할까." },
    blocks: [p("병원에 남아 추가로 확인한다.", [flag("hosp_extra_started", false)])],
    onExit: [setFlag("hosp_extra_started")],
    choices: [
      { id: "lead", label: "혈중 납 검사를 보낸다", conditions: available("hosp_lead_checked"), effects: [mark("hosp_lead_checked"), test(HARIN, "blood_lead", "pending")], next: "HOSP_LEAD" },
      { id: "electrolytes", label: "전해질을 다시 잰다", conditions: available("hosp_electrolytes_checked"), effects: [mark("hosp_electrolytes_checked"), addValue("incidental_findings", 1)], next: "HOSP_LYTES" },
      { id: "ck", label: "CK를 확인한다", conditions: available("hosp_ck_checked"), effects: [mark("hosp_ck_checked"), addValue("incidental_findings", 1)], next: "HOSP_CK" },
      { id: "ecg", label: "심전도를 찍는다", conditions: available("hosp_ecg_checked"), effects: [mark("hosp_ecg_checked"), addValue("incidental_findings", 1)], next: "HOSP_ECG" },
      { id: "urine", label: "소변 나트륨과 삼투압을 재검토한다", conditions: available("hosp_urine_checked"), effects: [mark("hosp_urine_checked"), addValue("incidental_findings", 1)], next: "HOSP_URINE" },
      { id: "finish", label: "추가 확인을 마친다", effects: [setFlag("hospital_extra_complete"), ...incrementLocation], next: "FIELD_RETURN" },
    ],
  },
  HOSP_LEAD: extraResult("HOSP_LEAD", [p("혈중 납 검체를 외부 기관으로 보낸다. 결과는 몇 시간 뒤다."), thought("mechanism", "납이라면 복통, 변비, 운동신경.\n맞긴 하다.", 3), thought("suspicion", "맞는 것과 맞히는 것은 다르다.", 3)]),
  HOSP_LYTES: extraResult("HOSP_LYTES", [s("22:24 전해질 재검\nNa 123\nK 3.6"), thought("reasoning", "낮은 게 문제가 아니다.\n떨어지는 속도가 문제다.")], [clue("progressive_hyponatremia")]),
  HOSP_CK: extraResult("HOSP_CK", [s("CK 96 U/L · 정상 범위"), thought("mechanism", "근육 자체는 멀쩡하다.\n약한 건 근육이 아니라\n근육에 명령을 보내는 쪽일 수 있다.", 3)], [clue("normal_ck")]),
  HOSP_ECG: extraResult("HOSP_ECG", [s("심전도\n동성빈맥 122회/분\nQTc 468 ms · 경계"), thought("reasoning", "빠르다. 이유 없이.\n자율신경이 흔들리고 있다.", 3)], [clue("tachycardia")]),
  HOSP_URINE: extraResult("HOSP_URINE", [s("소변 Na 58 mmol/L\n소변 삼투압 510 mOsm/kg\n체액량 정상 · SIADH 부합"), thought("mechanism", "복통, 빈맥, 고혈압, SIADH.\n전부 신경이 하는 일이야.", 3)], [clue("siadh_pattern")]),

  FIELD_RETURN: {
    id: "FIELD_RETURN",
    presentation: { prompt: "다음은." },
    blocks: [p("확인한 것들을 정리한다."), p("두 곳을 확인했다. 환자에게 돌아갈 시간이 가까워진다.", [valueAtLeast("field_locations_visited", 2)])],
    choices: [{ id: "investigate", label: "다른 곳을 조사한다", next: "FIELD_GATE" }, { id: "hospital", label: "병원으로 돌아간다", next: "DET_001" }],
  },
};

import type { Condition, Effect, StoryNode } from "@/game/types";
import { ability, clue, d, flag, go, p, setFlag, thought, valueAtLeast, valueBelow } from "./helpers";

const incrementLocation: Effect[] = [{ type: "valueIncrement", key: "field_locations_visited", amount: 1 }];
const available = (key: string): Condition[] => [flag(key, false)];
const hotspot = (key: string): Condition[] => [flag(key, false)];
const mark = (key: string): Effect => setFlag(key);
const returnChoice = (id: string, label: string, destination: string, extra: Condition[] = []) => ({
  id, label, conditions: [...extra, valueBelow("field_locations_visited", 2)], next: destination,
});
const overstayChoice = (id: string, label: string, destination: string, extra: Condition[] = []) => ({
  id: `${id}-overstay`, label, conditions: [...extra, valueAtLeast("field_locations_visited", 2)],
  effects: [{ type: "value" as const, key: "field_overstay_destination", value: destination }], next: `FIELD_OVERSTAY_${destination}`,
});

export const fieldNodes: Record<string, StoryNode> = {
  FIELD_GATE: { id: "FIELD_GATE", title: "FIELD INVESTIGATION", presentation: { timeLabel: "22:08" }, onEnter: [{ type: "advanceToTime", value: 1328 }], blocks: [
    d("플레이어", "“집이나 연습실에서 최근 달라진 걸 확인하고 싶습니다.”"), d("윤하린", "“집까지요?”"),
    d("플레이어", "“약, 음식, 환경 노출 같은 걸 직접 확인하고 싶습니다.”"),
    d("윤하린", "“세영이한테 연락하세요. 비밀번호도 알려줄게요.”", [{ type: "trust", patientId: "harin", operator: "gte", value: 55 }]),
    d("윤하린", "“엄마한테는 아직 말하지 마세요.”", [{ type: "trust", patientId: "harin", operator: "gte", value: 55 }]),
    d("윤하린", "“연습실은 괜찮아요. 집은 세영이랑 같이 가세요.”", [{ type: "trust", patientId: "harin", operator: "gte", value: 30 }, { type: "trust", patientId: "harin", operator: "lt", value: 55 }]),
    d("윤하린", "“싫어요.”", [{ type: "trust", patientId: "harin", operator: "lt", value: 30 }]),
  ], onExit: [{ type: "conditional", conditions: [{ type: "trust", patientId: "harin", operator: "gte", value: 55 }], effects: [setFlag("family_privacy_requested")] }], choices: [
    returnChoice("apartment", "하린의 집을 조사한다", "APT_001", [{ type: "trust", patientId: "harin", operator: "gte", value: 30 }, ...available("visited_apartment")]),
    overstayChoice("apartment", "하린의 집을 조사한다", "APT_001", [{ type: "trust", patientId: "harin", operator: "gte", value: 30 }, ...available("visited_apartment")]),
    returnChoice("rehearsal", "연습실을 조사한다", "REH_001", available("visited_rehearsal")), overstayChoice("rehearsal", "연습실을 조사한다", "REH_001", available("visited_rehearsal")),
    returnChoice("family", "가족에게 확인한다", "FAM_001", available("contacted_family")), overstayChoice("family", "가족에게 확인한다", "FAM_001", available("contacted_family")),
    returnChoice("hospital", "병원에 남아 추가 확인한다", "HOSP_EXTRA_001", available("hospital_extra_complete")), overstayChoice("hospital", "병원에 남아 추가 확인한다", "HOSP_EXTRA_001", available("hospital_extra_complete")),
    { id: "return-hospital", label: "병원으로 돌아간다", next: "DET_001" },
  ] },
  FIELD_OVERSTAY_APT_001: { id: "FIELD_OVERSTAY_APT_001", blocks: [thought("decision", "환자는 병원에 있다.\n\n정보가 더 필요한가,\n네가 더 필요한가?")], choices: [{ id: "continue-overstay", label: "그래도 집을 조사한다", effects: [setFlag("field_overstay"), { type: "time", amount: 15 }], next: "APT_001" }, { id: "return", label: "병원으로 돌아간다", next: "DET_001" }] },
  FIELD_OVERSTAY_REH_001: { id: "FIELD_OVERSTAY_REH_001", blocks: [thought("decision", "환자는 병원에 있다.\n\n정보가 더 필요한가,\n네가 더 필요한가?")], choices: [{ id: "continue-overstay", label: "그래도 연습실을 조사한다", effects: [setFlag("field_overstay"), { type: "time", amount: 15 }], next: "REH_001" }, { id: "return", label: "병원으로 돌아간다", next: "DET_001" }] },
  FIELD_OVERSTAY_FAM_001: { id: "FIELD_OVERSTAY_FAM_001", blocks: [thought("decision", "환자는 병원에 있다.\n\n정보가 더 필요한가,\n네가 더 필요한가?")], choices: [{ id: "continue-overstay", label: "그래도 가족에게 연락한다", effects: [setFlag("field_overstay"), { type: "time", amount: 15 }], next: "FAM_001" }, { id: "return", label: "병원으로 돌아간다", next: "DET_001" }] },
  FIELD_OVERSTAY_HOSP_EXTRA_001: { id: "FIELD_OVERSTAY_HOSP_EXTRA_001", blocks: [thought("decision", "환자는 병원에 있다.\n\n정보가 더 필요한가,\n네가 더 필요한가?")], choices: [{ id: "continue-overstay", label: "그래도 추가 확인한다", effects: [setFlag("field_overstay"), { type: "time", amount: 15 }], next: "HOSP_EXTRA_001" }, { id: "return", label: "환자에게 돌아간다", next: "DET_001" }] },

  APT_001: { id: "APT_001", title: "윤하린의 원룸", blocks: [p("윤하린의 작은 원룸.\n\n정돈되어 있지만 생활 흔적은 있다.")], choices: [
    { id: "fridge", label: "냉장고를 확인한다", conditions: hotspot("apt_fridge_complete"), next: "APT_FRIDGE" },
    { id: "vanity", label: "화장대를 살핀다", conditions: hotspot("apt_vanity_complete"), next: "APT_VANITY" },
    { id: "desk", label: "책상을 확인한다", conditions: hotspot("apt_desk_complete"), next: "APT_DESK" },
    { id: "exit", label: "조사를 마친다", next: "APT_EXIT" },
  ] },
  APT_FRIDGE: { id: "APT_FRIDGE", blocks: [p("냉장고 안.\n\n탄산수.\n저지방 요거트 두 개.\n달걀.\n병커피.\n\n제대로 된 식사 재료가 거의 없다."), thought("observation", "며칠 비운 냉장고가 아니다.", 2), thought("mechanism", "탄수화물이 거의 없다.", 3)], onEnter: [{ type: "time", amount: 6 }, mark("apt_fridge_complete"), setFlag("restricted_diet_known"), clue("severe_caloric_restriction")], choices: go("APT_001") },
  APT_VANITY: { id: "APT_VANITY", blocks: [
    p("화장대.\n\n화장품.\n비타민.\n진통제.\n\n그리고 작은 약 포장."),
    p("경구피임약 blister pack.", [{ type: "any", conditions: [ability("observation", 3), ability("suspicion", 3)] }]),
    { type: "thought", ability: "mechanism", text: "호르몬.", conditions: [ability("mechanism", 4), flag("ocp_known")] },
    { type: "thought", ability: "mechanism", text: "저열량.\n\n둘을 같이 기억해.", conditions: [ability("mechanism", 4), flag("ocp_known"), flag("restricted_diet_known")] },
  ], onEnter: [{ type: "time", amount: 8 }, mark("apt_vanity_complete"), { type: "conditional", conditions: [{ type: "any", conditions: [ability("observation", 3), ability("suspicion", 3)] }], effects: [setFlag("ocp_known"), clue("recent_hormonal_medication")] }], choices: go("APT_001") },
  APT_DESK: { id: "APT_DESK", blocks: [p("수첩.\n\nD-10  51.2\nD-8   50.4\nD-5   49.8\nD-3   49.1"), thought("observation", "짧은 시간이다."), thought("empathy", "‘조금 줄였다’는 말과\n이 숫자는 다르다.", 3)], onEnter: [{ type: "time", amount: 5 }, mark("apt_desk_complete"), setFlag("restricted_diet_known"), clue("rapid_weight_loss")], choices: go("APT_001") },
  APT_EXIT: { id: "APT_EXIT", blocks: [{ ...thought("reasoning", "발작 직전에 달라진 것들이 있다.\n\n식사.\n\n호르몬."), conditions: [flag("restricted_diet_known"), flag("ocp_known")] }], onEnter: [setFlag("visited_apartment"), ...incrementLocation], choices: go("FIELD_RETURN") },

  REH_001: { id: "REH_001", title: "밤의 연습실", blocks: [p("밤의 텅 빈 연습실.\n정세영이 기다린다."), d("정세영", "“뭐가 문제래요?”"), d("플레이어", "“아직 찾는 중입니다.”"), d("정세영", "“역시.”")], choices: [
    { id: "previous", label: "“역시?”", conditions: available("reh_prev_complete"), next: "REH_PREV" }, { id: "diet", label: "최근 식사 상태를 묻는다", conditions: available("reh_diet_complete"), next: "REH_DIET" },
    { id: "motor", label: "최근 힘이 빠지거나 이상했던 일이 있는지 묻는다", conditions: available("reh_motor_complete"), next: "REH_MOTOR" }, { id: "environment", label: "연습실 환경을 확인한다", conditions: available("reh_env_complete"), next: "REH_ENV" },
    { id: "ocp", label: "최근 새로 먹기 시작한 약이 있었는지 묻는다", conditions: [flag("reh_ocp_complete", false), { type: "any", conditions: [ability("empathy", 4), flag("restricted_diet_known"), flag("medication_incomplete")] }], next: "REH_OCP" }, { id: "exit", label: "조사를 마친다", next: "REH_EXIT" },
  ] },
  REH_PREV: { id: "REH_PREV", blocks: [d("정세영", "“작년에도 비슷했어요.\n\n배 아프다고 하고.\n\n잠 못 자고.\n\n되게 예민해지고.”")], onEnter: [mark("reh_prev_complete"), setFlag("previous_attacks_known"), clue("previous_attacks")], choices: go("REH_001") },
  REH_DIET: { id: "REH_DIET", blocks: [d("정세영", "“요즘 거의 안 먹었어요.\n커피만 마시는 날도 있었고.”"), d("플레이어", "“누가 체중 감량을 요구했습니까?”"), d("정세영", "“아뇨. 그렇게 단순한 건 아니에요.\n이번 공연 끝나면 중요한 오디션이 있어서…”"), thought("empathy", "강요받지 않았다는 것과\n압박이 없었다는 것은 다른 말이다.", 3)], onEnter: [mark("reh_diet_complete"), setFlag("restricted_diet_known"), clue("severe_caloric_restriction")], choices: go("REH_001") },
  REH_MOTOR: { id: "REH_MOTOR", blocks: [d("정세영", "“아. 며칠 전에 물병을 못 열었어요.”"), d("플레이어", "“왜요?”"), d("정세영", "“손에 힘이 안 들어간다고.”"), thought("reasoning", "복통보다 먼저.")], onEnter: [mark("reh_motor_complete"), setFlag("early_weakness_known"), clue("preexisting_motor_weakness")], choices: go("REH_001") },
  REH_ENV: { id: "REH_ENV", blocks: [p("낡은 연습실 일부에 공사 흔적."), thought("suspicion", "오래된 페인트.", 3), thought("mechanism", "납?", 3)], onEnter: [
    mark("reh_env_complete"),
    { type: "conditional", conditions: [ability("mechanism", 3)], effects: [setFlag("lead_poisoning_available"), { type: "diagnosis", patientId: "harin", diagnosisId: "lead_poisoning" }] },
  ], choices: go("REH_001") },
  REH_OCP: { id: "REH_OCP", blocks: [d("정세영", "“아, 그리고…\n하린이가 저한테 피임약 물어봤어요.\n생리 미루려고.\n열흘 정도 됐나.”")], onEnter: [mark("reh_ocp_complete"), setFlag("ocp_known"), clue("recent_hormonal_medication")], choices: go("REH_001") },
  REH_EXIT: { id: "REH_EXIT", blocks: [], onEnter: [setFlag("visited_rehearsal"), ...incrementLocation], choices: go("FIELD_RETURN") },

  FAM_001: { id: "FAM_001", blocks: [d("윤하린", "“엄마한테는 아직 말하지 마세요.”", [flag("family_privacy_requested")])], choices: [
    { id: "contact", label: "그래도 연락한다", effects: [setFlag("family_boundary_broken"), { type: "trust", patientId: "harin", amount: -15 }], next: "FAM_002" },
    { id: "decline", label: "연락하지 않는다", next: "FIELD_RETURN" }, { id: "permission", label: "하린에게 다시 허락을 구한다", next: "FAM_PERMISSION" },
  ] },
  FAM_PERMISSION: { id: "FAM_PERMISSION", blocks: [d("윤하린", "“꼭 필요해요?”")], choices: [
    { id: "explain", label: "가족력이 진단에 도움이 될 수 있습니다.", check: { id: "family-empathy", ability: "empathy", dc: 8 }, next: { success: "FAM_PERMISSION_OK", failure: "FAM_PERMISSION_DELAY" } },
    { id: "not-now", label: "지금은 연락하지 않는다", next: "FIELD_RETURN" },
    { id: "insist", label: "의학적으로 필요하다고 강하게 설득한다", check: { id: "family-decision", ability: "decision", dc: 9 }, next: { success: "FAM_PERMISSION_INSIST", failure: "FAM_PERMISSION_DELAY" } },
  ] },
  FAM_PERMISSION_OK: { id: "FAM_PERMISSION_OK", blocks: [d("윤하린", "“…제가 먼저 말하면 안 돼요?”"), d("플레이어", "“그렇게 하셔도 됩니다.”")], onEnter: [{ type: "trust", patientId: "harin", amount: 3 }], choices: go("FAM_002", "연락을 기다린다") },
  FAM_PERMISSION_INSIST: { id: "FAM_PERMISSION_INSIST", blocks: [d("윤하린", "“…알겠어요.”")], onEnter: [{ type: "trust", patientId: "harin", amount: -2 }], choices: go("FAM_002") },
  FAM_PERMISSION_DELAY: { id: "FAM_PERMISSION_DELAY", blocks: [d("윤하린", "“지금은 싫어요.”"), p("지금 강행하지 않아도 다른 경로는 남아 있다.")], choices: [
    { id: "return", label: "지금은 연락하지 않는다", next: "FIELD_RETURN" },
    { id: "contact-anyway", label: "그래도 가족에게 연락한다", effects: [setFlag("family_boundary_broken"), { type: "trust", patientId: "harin", amount: -15 }], next: "FAM_002" },
  ] },
  FAM_002: { id: "FAM_002", blocks: [d("윤미정", "“하린이가 또 병원 갔어요?”"), thought("history", "또.", 3), d("플레이어", "“가족 중 반복적인 심한 복통을 겪은 분이 있습니까?”"), d("윤미정", "“없어요.”"), thought("suspicion", "너무 빨랐다.", 3)], choices: go("FAM_003") },
  FAM_003: { id: "FAM_003", blocks: [d("플레이어", "“복통과 함께 불면, 이상행동, 손발 힘 빠짐 같은 증상은요?”"), p("침묵."), d("윤미정", "“제 동생이 좀 그랬어요.\n젊을 때 배가 자주 아팠고.\n검사하면 아무것도 안 나온다고…\n한 번은 손에 힘이 빠져 입원했고.\n정신과에도 갔어요.”"), thought("mechanism", "복부.\n정신.\n운동신경.\n반복성."), thought("reasoning", "그리고 한 가족.")], onEnter: [setFlag("family_history_known"), clue("maternal_family_recurrent_neurovisceral_attacks")], choices: go("FAM_004") },
  FAM_004: { id: "FAM_004", blocks: [d("플레이어", "“요즘도 그러십니까?”"), d("윤미정", "“아뇨. 마흔 넘고는 거의 못 들었어요.”"), thought("mechanism", "…", 5)], onEnter: [setFlag("contacted_family"), ...incrementLocation], choices: go("FIELD_RETURN") },

  HOSP_EXTRA_001: { id: "HOSP_EXTRA_001", blocks: [p("병원에 남아 추가 확인한다.")], choices: [
    { id: "lead", label: "혈중 납", conditions: available("hosp_lead_checked"), effects: [mark("hosp_lead_checked"), { type: "test", patientId: "harin", testId: "blood_lead", status: "pending" }], next: "HOSP_EXTRA_001" },
    ...[["electrolytes","반복 전해질"],["ck","CK"],["ecg","ECG"],["urine","urine sodium/osmolality 재검토"]].map(([id,label]) => ({ id, label, conditions: available(`hosp_${id}_checked`), effects: [mark(`hosp_${id}_checked`), { type: "valueIncrement" as const, key: "incidental_findings", amount: 1 }], next: "HOSP_EXTRA_001" })),
    { id: "finish", label: "추가 확인을 마친다", effects: [setFlag("hospital_extra_complete"), ...incrementLocation], next: "FIELD_RETURN" },
  ] },
  FIELD_RETURN: { id: "FIELD_RETURN", blocks: [p("확인한 정보를 정리한다."), p("두 곳을 확인했다. 환자에게 돌아갈 시간이 가까워진다.", [valueAtLeast("field_locations_visited", 2)])], choices: [{ id: "investigate", label: "다른 장소를 조사한다", next: "FIELD_GATE" }, { id: "hospital", label: "병원으로 돌아간다", next: "DET_001" }] },
};

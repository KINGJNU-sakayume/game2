import type { Condition, StoryNode } from "@/game/types";
import { d, flag, go, p, s, setFlag, thought } from "./helpers";

const not = (key: string): Condition => flag(key, false);
const value = (key: string, val: string): Condition => ({ type: "value", key, value: val });
const trustBelow = (n: number): Condition => ({ type: "trust", patientId: "harin", operator: "lt", value: n });
const boundaryBroken: Condition = { type: "any", conditions: [trustBelow(20), { type: "all", conditions: [flag("family_boundary_broken"), not("patient_apology_given")] }] };
const relationshipOkay: Condition = { type: "all", conditions: [{ type: "trust", patientId: "harin", operator: "gte", value: 20 }, { type: "any", conditions: [not("family_boundary_broken"), flag("patient_apology_given")] }] };
const triggerEnough: Condition = { type: "all", conditions: [flag("restricted_diet_known"), flag("ocp_known")] };
const triggerMissing: Condition = { type: "any", conditions: [not("restricted_diet_known"), not("ocp_known")] };
const successful: Condition = { type: "value", key: "diagnosis_outcome", value: "failed", operator: "neq" };
const diagnosisLate: Condition = value("diagnosis_outcome", "late");
const treatmentAppropriate: Condition = value("treatment_timing", "appropriate");
const treatmentDelayed: Condition = value("treatment_timing", "delayed");
const delayedOutcome: Condition = { type: "any", conditions: [diagnosisLate, treatmentDelayed, flag("treatment_delay_significant")] };

export const resolutionNodes: Record<string, StoryNode> = {
  WAIT_001: { id: "WAIT_001", title: "PBG / ALA pending", blocks: [p("하린의 근력저하는 진행 중이다."), thought("decision", "검사 결과가\n치료 시점을 정해주는 건 아니다."), thought("reasoning", "확신과 성급함은 다르다."), thought("empathy", "틀릴 경우 위험을 감당하는 건 환자다.")], choices: [
    { id: "early-hemin", label: "검체 채취를 확인하고 hemin 치료를 시작한다", next: "TX_PREP_01" },
    { id: "glucose-wait", label: "탄수화물 공급과 지지치료를 하며 결과를 기다린다", next: "TX_GLUCOSE_WAIT" },
    { id: "wait-result", label: "확진 결과가 나올 때까지 치료 결정을 미룬다", next: "TX_WAIT_RESULT" },
  ] },
  TX_PREP_01: { id: "TX_PREP_01", blocks: [d("강수진", "“PBG 검체는 이미 나갔습니다.”"), d("플레이어", "“헤민 준비해주세요.”"), d("강수진", "“네.”"), p("유발 가능 약물을 중단한다. 충분한 탄수화물 공급을 시작한다. 전해질과 신경학적 상태를 반복 평가한다.")], onEnter: [setFlag("hemin_started"), { type: "timeline", entry: { id: "hemin-started", time: 1429, kind: "decision", text: "Hemin started" } }, setFlag("disease_progression_halted"), { type: "value", key: "treatment_timing", value: "appropriate" }], choices: go("WAIT_002") },
  TX_GLUCOSE_WAIT: { id: "TX_GLUCOSE_WAIT", blocks: [d("플레이어", "“우선 탄수화물 공급을 시작하고 검사 결과를 보겠습니다.”"), p("포도당 공급. 전해질 교정. 모니터링. 하지만 근력저하는 멈추지 않는다."), d("윤하린", "“다리가 더 무거워요.”"), thought("decision", "지지치료가\n원인 치료는 아니다.")], onEnter: [{ type: "time", amount: 20 }, setFlag("supportive_only_initially"), { type: "value", key: "treatment_timing", value: "delayed" }, { type: "disease", patientId: "harin", stage: "critical" }], choices: go("PBG_RESULT") },
  TX_WAIT_RESULT: { id: "TX_WAIT_RESULT", blocks: [p("아직 적극적 원인 치료를 시작하지 않는다. 호흡은 유지되지만 상지 근력저하가 더 명확해진다."), d("강수진", "“선생님, 이제 팔도 힘이 떨어져요.”")], onEnter: [{ type: "time", amount: 30 }, { type: "value", key: "treatment_timing", value: "delayed" }, setFlag("treatment_delay_significant"), { type: "disease", patientId: "harin", stage: "critical" }], choices: go("PBG_RESULT") },
  WAIT_002: { id: "WAIT_002", blocks: [p("통증은 여전히 남아 있다. 맥박은 여전히 빠르다. 근력도 즉시 돌아오지 않는다. 하지만 더 빠르게 악화되는 흐름은 멈춘다.")], onEnter: [{ type: "time", amount: 10 }], choices: go("PBG_RESULT") },
  PBG_RESULT: { id: "PBG_RESULT", title: "PBG / ALA 결과", blocks: [d("강수진", "“결과 나왔습니다.”"), s("Urine PBG: markedly elevated\nUrine ALA: elevated"), thought("reasoning", "급성 간성 포르피린증."), thought("mechanism", "아직 급성 간헐성 포르피린증이라고 단정하지 마."), thought("reasoning", "알아.\n아형은 나중이다."), thought("decision", "환자는 지금이다.")], onEnter: [setFlag("pbg_positive"), { type: "timeline", entry: { id: "pbg-positive", time: 1429, kind: "test", text: "PBG / ALA positive" } }, setFlag("acute_hepatic_porphyria_confirmed"), { type: "test", patientId: "harin", testId: "urine_pbg_ala", status: "positive" }, { type: "value", key: "diagnosis_outcome", value: "appropriate" }], choices: [
    { id: "already-treated", label: "진단을 설명한다", conditions: [flag("hemin_started")], next: "DISCLOSE_001" },
    { id: "treatment-decision", label: "치료 방향을 결정한다", conditions: [not("hemin_started")], next: "TX_001" },
  ] },
  TX_001: { id: "TX_001", title: "치료 결정", blocks: [p("진행성 신경증상이 있는 중증 급성 발작이다.")], choices: [
    { id: "hemin", label: "hemin 치료를 시작한다", next: "TX_HEMIN" }, { id: "glucose", label: "탄수화물 공급만 계속한다", next: "TX_GLUCOSE" }, { id: "delay", label: "조금 더 관찰한다", next: "TX_DELAY" },
  ] },
  TX_HEMIN: { id: "TX_HEMIN", blocks: [d("플레이어", "“헤민 시작합니다.”")], onEnter: [setFlag("hemin_started"), { type: "timeline", entry: { id: "hemin-started", time: 1429, kind: "decision", text: "Hemin started" } }, setFlag("disease_progression_halted"), { type: "value", key: "treatment_timing", value: "delayed" }], choices: go("DISCLOSE_001") },
  TX_GLUCOSE: { id: "TX_GLUCOSE", blocks: [p("탄수화물 공급은 계속된다. 그러나 진행성 운동신경증상은 계속된다."), thought("decision", "충분하지 않다.")], onEnter: [{ type: "time", amount: 15 }, { type: "value", key: "treatment_timing", value: "delayed" }], choices: [{ id: "hemin", label: "hemin을 시작한다", next: "TX_HEMIN" }, { id: "wait", label: "계속 기다린다", next: "TX_DELAY" }] },
  TX_DELAY: { id: "TX_DELAY", blocks: [p("환자는 ICU 수준의 관찰이 필요한 상태가 된다. 호흡근 상태를 반복 평가한다.")], onEnter: [{ type: "time", amount: 15 }, { type: "value", key: "treatment_timing", value: "delayed" }, setFlag("treatment_delay_significant"), { type: "disease", patientId: "harin", stage: "critical" }], choices: [{ id: "hemin", label: "hemin을 시작한다", next: "TX_HEMIN" }] },
  DISCLOSE_001: { id: "DISCLOSE_001", presentation: { mode: "immersive", hideTime: true, hideCase: true, hideVitals: true }, blocks: [d("윤하린", "“찾았어요?”"), d("플레이어", "“급성 간성 포르피린증이라는 질환군으로 확인됐습니다.”"), p("잠시 침묵."), d("윤하린", "“제가 미친 게 아니었어요?”")], choices: [
    { id: "validate", label: "처음부터 그런 문제가 아니었습니다.", effects: [{ type: "trust", patientId: "harin", amount: 8 }, setFlag("patient_validation_given")], next: "DISCLOSE_002" },
    { id: "clinical", label: "증상에는 신경정신 증상도 포함될 수 있습니다.", effects: [{ type: "trust", patientId: "harin", amount: 2 }], next: "DISCLOSE_002" },
    { id: "treat-first", label: "일단 치료부터 하죠.", effects: [{ type: "trust", patientId: "harin", amount: -3 }], next: "DISCLOSE_002" },
  ] },
  DISCLOSE_002: { id: "DISCLOSE_002", blocks: [d("윤하린", "“다행이다.”"), p("잠시 웃는다."), d("윤하린", "“아픈데 다행이라는 말 이상하네요.”")], choices: go("TX_MONTAGE") },
  TX_MONTAGE: { id: "TX_MONTAGE", title: "치료와 회복", blocks: [s("DAY 1"), p("복통이 완화되기 시작한다. 빈맥과 혈압은 점차 개선되고 Na는 안정화 방향이지만 운동약화는 남는다."), s("DAY 2–3"), p("구토와 복통이 더 감소한다. 잠을 잘 수 있게 된다. 근력은 천천히 회복되고 재활 평가가 이어진다."), p("근력 회복이 더디다. 보행 재활이 필요하다.", [flag("treatment_delay_significant")]), p("중증 신경병증의 진행은 멈췄지만 회복은 즉각적이지 않다.", [not("treatment_delay_significant")])], onEnter: [{ type: "conditional", conditions: [flag("treatment_delay_significant")], effects: [setFlag("residual_weakness")] }], choices: go("RECOVERY_001") },
  RECOVERY_001: { id: "RECOVERY_001", title: "며칠 뒤", blocks: [d("강수진", "“오늘 처음 제대로 먹네요.”"), d("윤하린", "“이거 맛없는 거 맞죠?”"), d("강수진", "“병원 죽이니까요.”"), d("윤하린", "“다행이다. 제 혀 문제인 줄.”"), p("하린이 숟가락을 든다."), thought("observation", "이번에는 한 손이다.", 3)], choices: go("EXPLAIN_001") },
  EXPLAIN_001: { id: "EXPLAIN_001", blocks: [p("급성 간성 포르피린증은 heme synthesis pathway와 관련된 질환군이다. 저열량·저탄수화물 상태와 호르몬 노출이 촉발 요인으로 의심되고 수면 부족과 스트레스도 배경이 될 수 있다."), d("윤하린", "“그럼 제가 안 먹어서 생긴 거네요.”")], choices: [
    { id: "multiple", label: "그것도 촉발 요인 중 하나입니다. 원인은 하나가 아닙니다.", effects: [{ type: "trust", patientId: "harin", amount: 5 }], next: "EXPLAIN_002" },
    { id: "blame", label: "식사 제한이 큰 원인이었던 건 맞습니다.", effects: [{ type: "trust", patientId: "harin", amount: -4 }], next: "EXPLAIN_002" },
    { id: "genetic", label: "유전적 소인이 있는지는 추가 확인이 필요합니다.", effects: [{ type: "trust", patientId: "harin", amount: 1 }], next: "EXPLAIN_002" },
  ] },
  EXPLAIN_002: { id: "EXPLAIN_002", blocks: [d("윤하린", "“근데 왜 아무도 몰랐어요?”")], choices: [
    { id: "missed-clues", label: "이전에도 단서는 있었지만 진단까지 연결되지 않았습니다.", effects: [{ type: "trust", patientId: "harin", amount: 4 }], next: "ETHICS_001" },
    { id: "rare", label: "흔한 병이 아니라 그렇습니다.", effects: [{ type: "trust", patientId: "harin", amount: -2 }], next: "ETHICS_001" },
    { id: "normal-tests", label: "이전 검사들이 정상이었기 때문입니다.", effects: [{ type: "trust", patientId: "harin", amount: -5 }], next: "ETHICS_001" },
  ] },
  ETHICS_001: { id: "ETHICS_001", blocks: [], choices: [{ id: "family", label: "가족 연락에 관해 이야기한다", conditions: [flag("family_boundary_broken")], next: "ETHICS_FAMILY" }, { id: "respected", label: "후속 계획을 이야기한다", conditions: [not("family_boundary_broken")], next: "ETHICS_RESPECTED" }] },
  ETHICS_FAMILY: { id: "ETHICS_FAMILY", blocks: [d("윤하린", "“엄마한테 연락했죠. 제가 하지 말라고 했는데. 필요하면 다 해도 되는 거예요?”")], choices: [
    { id: "apologize", label: "결과적으로 도움이 됐지만, 당신이 싫다고 한 걸 어긴 건 맞습니다.", effects: [{ type: "trust", patientId: "harin", amount: 8 }, setFlag("patient_apology_given")], next: "DISCHARGE_001" },
    { id: "justify", label: "진단을 위해 필요한 정보였습니다.", effects: [{ type: "trust", patientId: "harin", amount: -6 }, setFlag("patient_apology_given", false)], next: "DISCHARGE_001" },
    { id: "no-option", label: "그때는 다른 방법이 없었습니다.", effects: [{ type: "trust", patientId: "harin", amount: -4 }, setFlag("patient_apology_given", false)], next: "DISCHARGE_001" },
  ] },
  ETHICS_RESPECTED: { id: "ETHICS_RESPECTED", blocks: [d("윤하린", "“엄마한테는 제가 말할게요.”"), d("플레이어", "“원하면 가족 상담도 같이 잡겠습니다.”"), d("윤하린", "“네.”")], choices: go("DISCHARGE_001") },
  DISCHARGE_001: { id: "DISCHARGE_001", title: "퇴원 계획", blocks: [p("유발 가능 약물과 호르몬 노출을 검토한다. 무리한 금식과 극단적 식사 제한을 피하고, 비슷한 증상이 생기면 급성 포르피린증 병력을 알리도록 설명한다. 유전 상담과 아형 검사를 예약한다."), p("잔여 근력저하에 대한 재활치료 계획을 강조한다.", [flag("treatment_delay_significant")]), p("점진적인 일상 복귀 계획을 확인한다.", [not("treatment_delay_significant")])], choices: go("EP_001") },
  EP_001: { id: "EP_001", title: "17일 후", blocks: [s("HMBS pathogenic variant identified."), s("최종 아형 진단: 급성 간헐성 포르피린증\nAcute Intermittent Porphyria"), thought("reasoning", "이제 아형까지 이름이 생겼다.")], onEnter: [setFlag("aip_confirmed"), { type: "value", key: "final_diagnosis", value: "acute_intermittent_porphyria" }, { type: "test", patientId: "harin", testId: "hmbs_variant", status: "positive" }, { type: "timeline", entry: { id: "hmbs-positive", time: 1429 + 17 * 1440, kind: "test", text: "HMBS positive" } }], choices: go("EP_002") },
  EP_002: { id: "EP_002", blocks: [d("윤하린", "“오늘 물병 혼자 열었어요.”", [{ type: "trust", patientId: "harin", operator: "gte", value: 60 }]), p("외래 기록으로 회복 경과를 확인한다.", [{ type: "all", conditions: [{ type: "trust", patientId: "harin", operator: "gte", value: 30 }, { type: "trust", patientId: "harin", operator: "lt", value: 60 }] }]), p("후속 진료가 다른 진료팀으로 전환된다.", [{ type: "any", conditions: [trustBelow(30), boundaryBroken] }])], choices: go("END_CALC") },
  FAIL_001: { id: "FAIL_001", blocks: [p("시간이 흐르고 하린의 근력저하가 진행한다. 다른 팀이 재평가한다."), s("후속 기록: Urine PBG markedly elevated.\nHMBS pathogenic variant confirmed."), thought("reasoning", "정상은 진단이 아니다.")], onEnter: [
    { type: "time", amount: 60 },
    { type: "value", key: "diagnosis_outcome", value: "failed" },
    setFlag("pbg_positive"),
    setFlag("acute_hepatic_porphyria_confirmed"),
    setFlag("aip_confirmed"),
    { type: "test", patientId: "harin", testId: "urine_pbg_ala", status: "positive" },
    { type: "test", patientId: "harin", testId: "hmbs_variant", status: "positive" },
    { type: "value", key: "final_diagnosis", value: "acute_intermittent_porphyria" },
  ], choices: go("END_CALC") },
  END_CALC: { id: "END_CALC", blocks: [p("진료 기록을 정리한다.")], choices: [
    { id: "failed", label: "기록을 마친다", conditions: [value("diagnosis_outcome", "failed")], effects: [{ type: "value", key: "ending_id", value: "END_E" }], next: "END_E" },
    { id: "delayed", label: "기록을 마친다", conditions: [successful, delayedOutcome], effects: [{ type: "value", key: "ending_id", value: "END_B" }], next: "END_B" },
    { id: "broken", label: "기록을 마친다", conditions: [successful, treatmentAppropriate, boundaryBroken], effects: [{ type: "value", key: "ending_id", value: "END_C" }], next: "END_C" },
    { id: "partial", label: "기록을 마친다", conditions: [successful, treatmentAppropriate, relationshipOkay, triggerMissing], effects: [{ type: "value", key: "ending_id", value: "END_D" }], next: "END_D" },
    { id: "complete", label: "기록을 마친다", conditions: [successful, treatmentAppropriate, relationshipOkay, triggerEnough], effects: [{ type: "value", key: "ending_id", value: "END_A" }], next: "END_A" },
  ] },
  END_A: { id: "END_A", title: "이름을 되찾다", blocks: [p("적절한 진단과 치료, 주요 촉발 요인 확인, 그리고 관계가 함께 보존됐다."), p("검사에는 아무것도 없었다.\n환자에게는 처음부터 있었다.")], choices: go("CASE_ARCHIVE") },
  END_B: { id: "END_B", title: "늦게 도착한 정답", blocks: [p("질환은 확인됐다. 하지만 운동신경병증 회복은 늦고 재활치료가 필요하다. 정답이 늦으면 정답 자체가 시간을 되돌리지는 못한다.")], choices: go("CASE_ARCHIVE") },
  END_C: { id: "END_C", title: "병은 찾고 사람은 잃다", blocks: [p("질환과 아형은 확인됐다. 하린은 후속 진료를 다른 의료진에게 옮긴다. 의학적 성공과 관계적 성공은 별개다.")], choices: go("CASE_ARCHIVE") },
  END_D: { id: "END_D", title: "절반의 진단", blocks: [p("질환명은 확인했지만 주요 촉발 요인을 충분히 밝히지 못했다. 후속 기록은 재발 가능성을 남긴다.")], choices: go("CASE_ARCHIVE") },
  END_E: { id: "END_E", title: "정상 검사라는 함정", blocks: [p("다른 팀이 뒤늦게 PBG/ALA와 HMBS로 진단했다. 초기 기록에는 기능성·정신과적 가능성이 남아 있다."), thought("reasoning", "정상은 진단이 아니다.")], choices: go("CASE_ARCHIVE") },
  CASE_ARCHIVE: { id: "CASE_ARCHIVE", title: "CASE 01 — 아무것도 없는 배", blocks: [s("최종 진단\n급성 간헐성 포르피린증 / Acute Intermittent Porphyria"), p("생화학적 진단: 소변 PBG/ALA 상승으로 확인된 급성 간성 포르피린증\n아형 확인: HMBS pathogenic variant\n합병증: 저나트륨혈증 · 운동신경병증 · 신경정신 증상"), p("점수와 등급이 아닌 실제 진료 경과를 보존한다.")], choices: go("REFLECTION") },
  REFLECTION: { id: "REFLECTION", title: "Reflection", blocks: [{ type: "thought", ability: "observation", text: "처음에도 있었다.", conditions: [{ type: "ability", ability: "observation", operator: "gte", value: 3 }, not("treatment_delay_significant")] }, thought("history", "‘이 정도는 처음’이라고 했다."), thought("mechanism", "장기는 멀쩡했다.\n경로가 문제였다."), { type: "thought", ability: "empathy", text: "믿게 만드는 것도 검사였다.", conditions: [flag("patient_validation_given")] }, { type: "thought", ability: "decision", text: "정답보다 먼저\n움직여야 할 순간이 있었다.", conditions: [flag("treatment_delay_significant")] }, s("Case Memory unlocked:\n정상은 진단이 아니다")], choices: go("CASE_COMPLETE") },
  CASE_COMPLETE: { id: "CASE_COMPLETE", title: "Case Complete", blocks: [p("Chapter 1의 기록이 보존되었습니다.")], choices: [{ id: "archive", label: "Case Archive 보기", next: "CASE_ARCHIVE" }, { id: "restart", label: "처음부터 다시 시작", next: "PR_001" }] },
};

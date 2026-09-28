import type { Condition, StoryNode } from "@/game/types";
import {
  HARIN, all, any, d, flag, go, harinTrust, log, me, minutes, note, p, s, setFlag, setValue, stage, test, thought, trusts, valueIs, valueNot, voice, when,
} from "./helpers";

const not = (key: string): Condition => flag(key, false);
const trustBelow = (n: number): Condition => trusts("lt", n);
const boundaryBroken: Condition = any(trustBelow(20), all(flag("family_boundary_broken"), not("patient_apology_given")));
const relationshipOkay: Condition = all(trusts("gte", 20), any(not("family_boundary_broken"), flag("patient_apology_given")));
const triggerEnough: Condition = all(flag("restricted_diet_known"), flag("ocp_known"));
const triggerMissing: Condition = any(not("restricted_diet_known"), not("ocp_known"));
const successful: Condition = valueNot("diagnosis_outcome", "failed");
const diagnosisLate: Condition = valueIs("diagnosis_outcome", "late");
const treatmentAppropriate: Condition = valueIs("treatment_timing", "appropriate");
const treatmentDelayed: Condition = valueIs("treatment_timing", "delayed");
const delayedOutcome: Condition = any(diagnosisLate, treatmentDelayed, flag("treatment_delay_significant"));
const onTime: Condition = all(treatmentAppropriate, valueNot("diagnosis_outcome", "late"));

export const resolutionNodes: Record<string, StoryNode> = {
  // ── ACT 4 · 치료 결정 ────────────────────────────────────────────────────
  WAIT_001: {
    id: "WAIT_001",
    title: "결과 대기",
    presentation: { prompt: "결과는 아직이다." },
    blocks: [
      p("하린의 근력저하는 진행 중이다."),
      thought("decision", "검사 결과가\n치료 시점을 정해주는 건 아니다."),
      thought("reasoning", "확신과 성급함은 다르다."),
      thought("empathy", "틀릴 경우 위험을 감당하는 건 환자다."),
    ],
    choices: [
      { id: "early-hemin", label: "검체 채취를 확인하고 헤민 치료를 시작한다", next: "TX_PREP_01" },
      { id: "glucose-wait", label: "탄수화물 공급과 지지치료를 하며 결과를 기다린다", next: "TX_GLUCOSE_WAIT" },
      { id: "wait-result", label: "확진 결과가 나올 때까지 치료 결정을 미룬다", next: "TX_WAIT_RESULT" },
    ],
  },
  TX_PREP_01: {
    id: "TX_PREP_01",
    presentation: { assetId: "SCN_006_TREATMENT" },
    blocks: [
      d("강수진", "“PBG 검체는 이미 나갔습니다.”"),
      me("“헤민 준비해주세요.”"),
      d("강수진", "“네.”"),
      p("유발 가능 약물을 끊는다.\n탄수화물 공급을 시작한다.\n전해질과 신경학적 상태를 반복해서 본다."),
    ],
    onEnter: [setFlag("hemin_started"), log("hemin-started", "헤민 투여 시작", "decision"), setFlag("disease_progression_halted"), setValue("treatment_timing", "appropriate")],
    choices: go("WAIT_002"),
  },
  TX_GLUCOSE_WAIT: {
    id: "TX_GLUCOSE_WAIT",
    blocks: [
      me("“우선 탄수화물 공급을 시작하고 결과를 보겠습니다.”"),
      p("포도당 공급.\n전해질 교정.\n모니터링."),
      p("근력저하는 멈추지 않는다."),
      d("윤하린", "“다리가 더 무거워요.”"),
      thought("decision", "지지치료가\n원인 치료는 아니다."),
    ],
    onEnter: [minutes(20), setFlag("supportive_only_initially"), setValue("treatment_timing", "delayed"), stage(HARIN, "critical")],
    choices: go("PBG_RESULT", "결과를 기다린다"),
  },
  TX_WAIT_RESULT: {
    id: "TX_WAIT_RESULT",
    blocks: [p("원인 치료를 시작하지 않는다.\n호흡은 유지되지만 팔의 힘이 눈에 띄게 떨어진다."), d("강수진", "“선생님, 이제 팔도 힘이 떨어져요.”")],
    onEnter: [minutes(30), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), stage(HARIN, "critical")],
    choices: go("PBG_RESULT", "결과를 기다린다"),
  },
  WAIT_002: {
    id: "WAIT_002",
    blocks: [p("통증은 남아 있다.\n맥박은 여전히 빠르다.\n근력도 바로 돌아오지는 않는다."), p("하지만 더 빠르게 나빠지던 흐름은 멈춘다.")],
    onEnter: [minutes(10)],
    choices: go("PBG_RESULT", "결과를 기다린다"),
  },
  PBG_RESULT: {
    id: "PBG_RESULT",
    title: "PBG / ALA 결과",
    blocks: [
      d("강수진", "“결과 나왔습니다.”"),
      s("Urine PBG · markedly elevated\nUrine ALA · elevated"),
      thought("reasoning", "급성 간성 포르피린증."),
      thought("mechanism", "아직 급성 간헐성 포르피린증이라고 단정하지 마."),
      thought("reasoning", "알아.\n아형은 나중이다."),
      thought("decision", "환자는 지금이다."),
    ],
    onEnter: [
      setFlag("pbg_positive"),
      log("pbg-positive", "소변 PBG/ALA 상승", "test"),
      setFlag("acute_hepatic_porphyria_confirmed"),
      test(HARIN, "urine_pbg_ala", "positive"),
      when([valueNot("diagnosis_outcome", "late")], [setValue("diagnosis_outcome", "appropriate")]),
    ],
    choices: [
      { id: "already-treated", label: "진단을 설명한다", conditions: [flag("hemin_started")], next: "DISCLOSE_001" },
      { id: "treatment-decision", label: "치료 방향을 정한다", conditions: [not("hemin_started")], next: "TX_001" },
    ],
  },
  TX_001: {
    id: "TX_001",
    title: "치료 결정",
    blocks: [p("진행성 신경증상이 있는 중증 급성 발작이다.")],
    choices: [
      { id: "hemin", label: "헤민 치료를 시작한다", next: "TX_HEMIN" },
      { id: "glucose", label: "탄수화물 공급만 계속한다", next: "TX_GLUCOSE" },
      { id: "delay", label: "조금 더 지켜본다", next: "TX_DELAY" },
    ],
  },
  TX_HEMIN: {
    id: "TX_HEMIN",
    presentation: { assetId: "SCN_006_TREATMENT" },
    blocks: [me("“헤민 시작합니다.”"), p("붉은 약이 수액줄을 따라 내려간다.")],
    onEnter: [setFlag("hemin_started"), log("hemin-started", "헤민 투여 시작", "decision"), setFlag("disease_progression_halted"), setValue("treatment_timing", "delayed")],
    choices: go("DISCLOSE_001"),
  },
  TX_GLUCOSE: {
    id: "TX_GLUCOSE",
    blocks: [p("탄수화물 공급은 계속된다.\n진행성 운동신경증상도 계속된다."), thought("decision", "충분하지 않다.")],
    onEnter: [minutes(15), setValue("treatment_timing", "delayed")],
    choices: [{ id: "hemin", label: "헤민을 시작한다", next: "TX_HEMIN" }, { id: "wait", label: "계속 기다린다", next: "TX_DELAY" }],
  },
  TX_DELAY: {
    id: "TX_DELAY",
    blocks: [p("환자는 중환자실 수준의 관찰이 필요한 상태가 된다.\n호흡근 상태를 반복해서 평가한다.")],
    onEnter: [minutes(15), setValue("treatment_timing", "delayed"), setFlag("treatment_delay_significant"), stage(HARIN, "critical")],
    choices: [{ id: "hemin", label: "헤민을 시작한다", next: "TX_HEMIN" }],
  },

  // ── ACT 5 · 설명, 회복, 윤리 ──────────────────────────────────────────────
  DISCLOSE_001: {
    id: "DISCLOSE_001",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, hideVitals: true, backdrop: "black" },
    blocks: [
      d("윤하린", "“찾았어요?”"),
      me("“급성 간성 포르피린증이라는 질환군으로 확인됐습니다.”"),
      p("잠시 침묵."),
      d("윤하린", "“제가 미친 게 아니었어요?”"),
    ],
    choices: [
      { id: "validate", label: "“처음부터 그런 문제가 아니었습니다.”", effects: [harinTrust(8), setFlag("patient_validation_given")], next: "DISCLOSE_002" },
      { id: "clinical", label: "“이 병은 신경정신 증상도 함께 올 수 있습니다.”", effects: [harinTrust(2)], next: "DISCLOSE_002" },
      { id: "treat-first", label: "“일단 치료부터 하죠.”", effects: [harinTrust(-3)], next: "DISCLOSE_002" },
    ],
  },
  DISCLOSE_002: {
    id: "DISCLOSE_002",
    presentation: { mode: "immersive", hideTime: true, hideCase: true, backdrop: "black" },
    blocks: [d("윤하린", "“다행이다.”"), p("하린이 잠깐 웃는다."), d("윤하린", "“아픈데 다행이라는 말, 이상하네요.”")],
    choices: go("TX_MONTAGE"),
  },
  TX_MONTAGE: {
    id: "TX_MONTAGE",
    title: "치료와 회복",
    presentation: { titleStyle: "phase", titleCaption: "DAY 1 — 3", backdrop: "ward", hideTime: true },
    blocks: [
      s("DAY 1"),
      p("복통이 누그러지기 시작한다.\n맥박과 혈압이 조금씩 내려온다.\n나트륨은 천천히 올라온다.\n다리의 힘은 아직이다."),
      s("DAY 2 — 3"),
      p("구토가 멎는다.\n처음으로 네 시간을 내리 잔다.\n재활팀이 침대 옆에 다녀간다."),
      p("근력 회복이 더디다. 보행 재활이 필요하다.", [flag("treatment_delay_significant")]),
      p("신경병증의 진행은 멈췄다. 회복은 느리지만 방향은 맞다.", [not("treatment_delay_significant")]),
    ],
    onEnter: [when([flag("treatment_delay_significant")], [setFlag("residual_weakness")])],
    choices: go("RECOVERY_001"),
  },
  RECOVERY_001: {
    id: "RECOVERY_001",
    title: "며칠 뒤",
    presentation: { assetId: "SCN_007_RECOVERY", titleStyle: "place", location: "병동 8층", hideTime: true },
    blocks: [
      d("강수진", "“오늘 처음 제대로 드시네요.”"),
      d("윤하린", "“이거 맛없는 거 맞죠?”"),
      d("강수진", "“병원 죽이니까요.”"),
      d("윤하린", "“다행이다. 제 혀 문제인 줄.”"),
      p("하린이 숟가락을 든다."),
      thought("observation", "이번에는 한 손이다.", 3),
    ],
    choices: go("EXPLAIN_001"),
  },
  EXPLAIN_001: {
    id: "EXPLAIN_001",
    blocks: [
      d("윤하린", "“근데 그게 정확히 뭐예요? 이름이 너무 길어서 못 외우겠어요.”"),
      me("“몸에는 헴이라는 걸 만드는 공정이 있어요. 여덟 단계쯤 되는 조립 라인이요.”"),
      me("“하린 씨는 그중 한 단계가 조금 느린 것 같아요. 평소엔 아무 문제 없고요.”"),
      me("“그런데 굶거나, 특정 호르몬이 들어오면 몸이 그 라인을 전속력으로 돌려요.”"),
      me("“느린 단계 앞에 재료가 쌓이고, 그 재료가 신경을 건드립니다. 배, 심장, 다리, 머리까지.”"),
      d("윤하린", "“그럼 제가 안 먹어서 생긴 거네요.”"),
    ],
    choices: [
      { id: "multiple", label: "“그것도 방아쇠 중 하나예요. 원인이 하나는 아닙니다.”", effects: [harinTrust(5)], next: "EXPLAIN_002" },
      { id: "blame", label: "“식사 제한이 큰 원인이었던 건 맞습니다.”", effects: [harinTrust(-4)], next: "EXPLAIN_002" },
      { id: "genetic", label: "“어느 단계가 느린지는 유전자 검사로 확인할 거예요.”", effects: [harinTrust(1)], next: "EXPLAIN_002" },
    ],
  },
  EXPLAIN_002: {
    id: "EXPLAIN_002",
    blocks: [d("윤하린", "“근데 왜 아무도 몰랐어요?”")],
    choices: [
      { id: "missed-clues", label: "“전에도 단서는 있었어요. 아무도 하나로 묶지 않았을 뿐입니다.”", effects: [harinTrust(4)], next: "ETHICS_001" },
      { id: "rare", label: "“흔한 병이 아니라서요.”", effects: [harinTrust(-2)], next: "ETHICS_001" },
      { id: "normal-tests", label: "“이전 검사들이 정상이었으니까요.”", effects: [harinTrust(-5)], next: "ETHICS_001" },
    ],
  },
  ETHICS_001: {
    id: "ETHICS_001",
    blocks: [],
    choices: [
      { id: "family", label: "가족 연락에 관해 이야기한다", conditions: [flag("family_boundary_broken")], next: "ETHICS_FAMILY" },
      { id: "respected", label: "후속 계획을 이야기한다", conditions: [not("family_boundary_broken")], next: "ETHICS_RESPECTED" },
    ],
  },
  ETHICS_FAMILY: {
    id: "ETHICS_FAMILY",
    blocks: [d("윤하린", "“엄마한테 연락했죠.”"), d("윤하린", "“제가 하지 말라고 했는데.”", [flag("family_privacy_requested")]), d("윤하린", "“필요하면 다 해도 되는 거예요?”")],
    choices: [
      { id: "apologize", label: "“결과적으로 도움이 됐지만, 당신 뜻을 어긴 건 맞습니다. 미안합니다.”", effects: [harinTrust(8), setFlag("patient_apology_given")], next: "DISCHARGE_001" },
      { id: "justify", label: "“진단에 필요한 정보였습니다.”", effects: [harinTrust(-6), setFlag("patient_apology_given", false)], next: "DISCHARGE_001" },
      { id: "no-option", label: "“그때는 다른 방법이 없었습니다.”", effects: [harinTrust(-4), setFlag("patient_apology_given", false)], next: "DISCHARGE_001" },
    ],
  },
  ETHICS_RESPECTED: {
    id: "ETHICS_RESPECTED",
    blocks: [d("윤하린", "“엄마한테는 제가 말할게요.”"), me("“원하면 가족 상담도 같이 잡겠습니다.”"), d("윤하린", "“네.”")],
    choices: go("DISCHARGE_001"),
  },
  DISCHARGE_001: {
    id: "DISCHARGE_001",
    title: "퇴원",
    presentation: { titleStyle: "place", location: "병동 8층", hideTime: true },
    blocks: [
      note("퇴원 안내\n\n새 약을 시작할 땐 포르피린증이라고 먼저 말할 것\n굶지 말 것. 공연 전에도.\n비슷한 통증이 오면 참지 말고 올 것\n유전 상담 · 아형 검사 예약됨"),
      note("재활치료 일정 · 주 3회", [flag("treatment_delay_significant")]),
      d("윤하린", "“‘공연 전에도’는 선생님이 쓴 거죠.”"),
      me("“네.”"),
      d("윤하린", "“글씨 진짜 못 쓰시네요.”", [trusts("gte", 50)]),
    ],
    choices: go("EP_001"),
  },

  // ── ACT 6 · 아형 확정과 후속 ─────────────────────────────────────────────
  EP_001: {
    id: "EP_001",
    title: "17일 후",
    presentation: { titleStyle: "place", hideTime: true, backdrop: "paper", hideCase: true },
    blocks: [s("HMBS pathogenic variant identified."), s("최종 진단 · 급성 간헐성 포르피린증\nAcute Intermittent Porphyria"), thought("reasoning", "이제 아형까지 이름이 생겼다.")],
    onEnter: [
      setFlag("aip_confirmed"), setValue("final_diagnosis", "acute_intermittent_porphyria"), test(HARIN, "hmbs_variant", "positive"),
      log("hmbs-positive", "HMBS 병적 변이 확인", "test", 1429 + 17 * 1440),
    ],
    choices: go("EP_002"),
  },
  EP_002: {
    id: "EP_002",
    presentation: { hideTime: true, backdrop: "paper", hideCase: true },
    blocks: [
      note("윤하린 · 메시지\n오늘 물병 혼자 열었어요.", [trusts("gte", 60), not("follow_up_transferred")]),
      p("외래 기록으로 회복 경과를 확인한다.", [trusts("gte", 30), trusts("lt", 60), not("follow_up_transferred")]),
      p("후속 진료가 다른 진료팀으로 넘어간다.", [flag("follow_up_transferred")]),
    ],
    onEnter: [when([any(trustBelow(30), boundaryBroken)], [setFlag("follow_up_transferred")])],
    choices: go("END_CALC", "기록을 정리한다"),
  },
  FAIL_001: {
    id: "FAIL_001",
    presentation: { backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("시간이 흐르고, 하린의 근력저하는 계속 진행한다."),
      p("다른 팀이 하린을 다시 평가한다."),
      s("타 병원 회신\nUrine PBG · markedly elevated\nHMBS pathogenic variant confirmed"),
      thought("reasoning", "정상은 진단이 아니다."),
    ],
    onEnter: [
      minutes(60),
      setValue("diagnosis_outcome", "failed"),
      setFlag("pbg_positive"),
      setFlag("acute_hepatic_porphyria_confirmed"),
      setFlag("aip_confirmed"),
      test(HARIN, "urine_pbg_ala", "positive"),
      test(HARIN, "hmbs_variant", "positive"),
      setValue("final_diagnosis", "acute_intermittent_porphyria"),
    ],
    choices: go("END_CALC", "기록을 정리한다"),
  },
  END_CALC: {
    id: "END_CALC",
    presentation: { prompt: "기록을 닫는다.", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [],
    choices: [
      { id: "failed", label: "기록을 마친다", conditions: [valueIs("diagnosis_outcome", "failed")], effects: [setValue("ending_id", "END_E")], next: "END_E" },
      { id: "delayed", label: "기록을 마친다", conditions: [successful, delayedOutcome], effects: [setValue("ending_id", "END_B")], next: "END_B" },
      { id: "broken", label: "기록을 마친다", conditions: [successful, onTime, boundaryBroken], effects: [setValue("ending_id", "END_C")], next: "END_C" },
      { id: "partial", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, triggerMissing], effects: [setValue("ending_id", "END_D")], next: "END_D" },
      { id: "complete", label: "기록을 마친다", conditions: [successful, onTime, relationshipOkay, triggerEnough], effects: [setValue("ending_id", "END_A")], next: "END_A" },
    ],
  },

  // ── ACT 7 · 엔딩 ────────────────────────────────────────────────────────
  END_A: {
    id: "END_A",
    title: "이름을 되찾다",
    presentation: { titleStyle: "ending", titleCaption: "ENDING A", backdrop: "dawn", hideTime: true, hideCase: true },
    blocks: [
      p("석 달 뒤, 병원 우편함에 공연 전단 한 장이 꽂혀 있다."),
      p("앙상블 명단 맨 아래, 윤하린."),
      p("이름 옆에 볼펜으로 작은 동그라미."),
      p("검사에는 아무것도 없었다.\n환자에게는 처음부터 있었다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_B: {
    id: "END_B",
    title: "늦게 도착한 정답",
    presentation: { titleStyle: "ending", titleCaption: "ENDING B", backdrop: "ward", hideTime: true, hideCase: true },
    blocks: [
      p("재활실. 하린이 평행봉을 잡고 세 번째 걸음을 뗀다."),
      d("윤하린", "“어제는 두 걸음이었어요.”"),
      p("병명은 맞았다. 치료도 맞았다."),
      p("다만 정답이 도착하는 동안 신경이 먼저 다쳤다.\n정답은 시간을 되돌려주지 않는다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_C: {
    id: "END_C",
    title: "병은 찾고 사람은 잃다",
    presentation: { titleStyle: "ending", titleCaption: "ENDING C", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("외래 명단에서 윤하린의 이름이 빠져 있다."),
      note("전원 요청서\n사유 · 담당의 변경 희망"),
      p("병은 찾았다.\n그 병을 가진 사람은 다른 문으로 나갔다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_D: {
    id: "END_D",
    title: "절반의 진단",
    presentation: { titleStyle: "ending", titleCaption: "ENDING D", backdrop: "er-night", hideTime: true, hideCase: true },
    blocks: [
      p("넉 달 뒤, 새벽 세 시."),
      p("응급실 대기 화면에 익숙한 이름이 뜬다."),
      s("윤하린 · F/28 · 복통"),
      p("병의 이름은 알았다.\n무엇이 방아쇠를 당기는지는 끝내 몰랐다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },
  END_E: {
    id: "END_E",
    title: "정상 검사라는 함정",
    presentation: { titleStyle: "ending", titleCaption: "ENDING E", backdrop: "paper", hideTime: true, hideCase: true },
    blocks: [
      p("다른 병원의 회신이 도착한다. 소변 PBG 현저한 상승. HMBS 변이."),
      p("첫 기록에는 내가 쓴 문장이 그대로 남아 있다."),
      note("임상적 인상 · 기능성 복통 의증"),
      thought("reasoning", "정상은 진단이 아니다."),
    ],
    choices: go("CASE_ARCHIVE", "사건 기록을 연다"),
  },

  // ── ACT 8 · 기록 ────────────────────────────────────────────────────────
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
      voice("observation", "처음에도 있었다.", [{ type: "ability", ability: "observation", operator: "gte", value: 3 }, not("treatment_delay_significant")]),
      thought("history", "‘이 정도는 처음’이라고 했다."),
      thought("mechanism", "장기는 멀쩡했다.\n경로가 문제였다."),
      voice("empathy", "믿게 만드는 것도 검사였다.", [flag("patient_validation_given")]),
      voice("decision", "정답보다 먼저\n움직여야 할 순간이 있었다.", [flag("treatment_delay_significant")]),
      voice("suspicion", "처음 고른 가설은 배였다.\n배는 처음부터 아무 말도 하지 않았다.", [valueIs("initial_anchor", "acute_abdomen")]),
      voice("reasoning", "처음 고른 가설은 마음이었다.\n그 문장을 지우는 데 하루가 걸렸다.", [valueIs("initial_anchor", "functional_psychiatric")]),
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

export const chapter01Endings = ["END_A", "END_B", "END_C", "END_D", "END_E"] as const;

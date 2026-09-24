import type { StoryNode } from "@/game/types";
import { clue, d, flag, go, p, s, setFlag, thought } from "./helpers";

export const deteriorationNodes: Record<string, StoryNode> = {
  DET_001: { id: "DET_001", title: "23:31", presentation: { timeLabel: "23:31" }, onEnter: [{ type: "advanceToTime", value: 1411 }, { type: "timeline", entry: { id: "na121", time: 1411, kind: "clinical", text: "Na 121" } }, { type: "value", key: "sodium", value: 121 }, { type: "disease", patientId: "harin", stage: "progressing" }], blocks: [
    d("강수진", "“선생님.”"), d("강수진", "“Na 121입니다.”"), d("강수진", "“그리고 환자가 좀 이상합니다.”"), d("윤하린", "“저 소리 좀 꺼주세요.”"), d("강수진", "“…아무 소리도 안 나요.”"),
  ], choices: go("DET_002") },
  DET_002: { id: "DET_002", title: "23:49 응급실 07", presentation: { timeLabel: "23:49", location: "응급실 07" }, onEnter: [{ type: "advanceToTime", value: 1429 }, clue("perceptual_disturbance"), clue("worsening_neuropsychiatric_symptoms")], blocks: [
    p("하린은 침대 머리를 올리고 있다."), d("윤하린", "“무대 음악이 계속 들려요.”"), d("윤하린", "“여기 아닌 거 알아요.”"), d("윤하린", "“근데 계속 들려요.”"),
  ], choices: go("DET_003") },
  DET_003: { id: "DET_003", presentation: { assetId: "SCN_005_ER_DETERIORATION", clinicalData: [{ label: "HR", value: "126", tone: "warning" }, { label: "BP", value: "174/106", tone: "critical" }, { label: "Na", value: "121", tone: "critical" }] }, blocks: [p("근위부 하지 근력이 명확히 감소했다.\n상지에도 약화가 시작된다.\n감각은 비교적 유지된다.\n호흡은 아직 안정적이다."), d("강수진", "“혈압도 계속 높습니다.”"), s("HR 126\nBP 174/106\nNa 121")], onEnter: [clue("progressive_motor_neuropathy"), clue("autonomic_instability"), { type: "timeline", entry: { id: "motor-progression", time: 1429, kind: "clinical", text: "운동신경 약화 진행" } }], choices: go("CASE_002") },
  CASE_002: { id: "CASE_002", title: "Case Conference", presentation: { mode: "cinematic" }, blocks: [
    s("심한 복통\n변비\n빈맥 / 고혈압\n저나트륨혈증\n불면 / 지각 이상\n운동신경 약화"),
    thought("mechanism", "복통은 내장신경.\n\n빈맥과 고혈압은 자율신경.\n\n약화는 운동신경.\n\n혼란은 중추신경.\n\n나트륨은 그 사이에 끼어 있다."), thought("reasoning", "하나의 질환으로 묶는다."),
    { type: "thought", ability: "history", label: "? 문진", text: "금식.", conditions: [flag("restricted_diet_known")] },
    { type: "thought", ability: "suspicion", label: "／ 의심", text: "호르몬.", conditions: [flag("ocp_known")] },
    { type: "thought", ability: "empathy", label: "∿ 공감", text: "이모.", conditions: [flag("family_history_known")] },
    { type: "thought", ability: "observation", label: "◉ 관찰", text: "소변.", conditions: [flag("urine_color_known")] },
    thought("mechanism", "헴."),
  ], onEnter: [setFlag("acute_hepatic_porphyria_available"), { type: "diagnosis", patientId: "harin", diagnosisId: "acute_abdominal_pathology" }, { type: "diagnosis", patientId: "harin", diagnosisId: "lead_poisoning" }, { type: "diagnosis", patientId: "harin", diagnosisId: "guillain_barre" }, { type: "diagnosis", patientId: "harin", diagnosisId: "pheochromocytoma" }, { type: "diagnosis", patientId: "harin", diagnosisId: "toxic_drug" }, { type: "diagnosis", patientId: "harin", diagnosisId: "functional_psychiatric" }, { type: "diagnosis", patientId: "harin", diagnosisId: "acute_hepatic_porphyria" }], choices: go("CASE_003") },
};

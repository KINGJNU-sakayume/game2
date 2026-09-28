import type { StoryNode } from "@/game/types";
import { HARIN, addDiagnosis, clue, d, flag, go, log, p, s, setFlag, stage, test, testIs, thought, voice, when } from "./helpers";

const differentials = ["acute_abdominal_pathology", "lead_poisoning", "guillain_barre", "pheochromocytoma", "toxic_drug", "functional_psychiatric", "acute_hepatic_porphyria"];

export const deteriorationNodes: Record<string, StoryNode> = {
  DET_001: {
    id: "DET_001",
    title: "23:31",
    presentation: { timeLabel: "23:31", location: "응급실 07", titleStyle: "place", assetId: "SCN_001_ER_INITIAL" },
    onEnter: [{ type: "advanceToTime", value: 1411 }, log("na121", "Na 121", "clinical", 1411), { type: "value", key: "sodium", value: 121 }, stage(HARIN, "progressing")],
    blocks: [
      d("강수진", "“선생님.”"),
      d("강수진", "“Na 121입니다.”"),
      d("강수진", "“그리고 환자가 좀 이상합니다.”"),
      d("윤하린", "“저 소리 좀 꺼주세요.”"),
      d("강수진", "“…아무 소리도 안 나요.”"),
    ],
    choices: go("DET_002"),
  },
  DET_002: {
    id: "DET_002",
    presentation: { timeLabel: "23:49", location: "응급실 07" },
    onEnter: [{ type: "advanceToTime", value: 1429 }, clue("perceptual_disturbance"), clue("worsening_neuropsychiatric_symptoms")],
    blocks: [
      p("하린은 침대 머리를 올린 채 앉아 있다."),
      d("윤하린", "“무대 음악이 계속 들려요.”"),
      d("윤하린", "“여기 아닌 거 알아요.”"),
      d("윤하린", "“근데 계속 들려요.”"),
    ],
    choices: go("DET_003"),
  },
  DET_003: {
    id: "DET_003",
    presentation: {
      assetId: "SCN_005_ER_DETERIORATION",
      clinicalData: [{ label: "HR", value: "126", tone: "warning" }, { label: "BP", value: "174/106", tone: "critical" }, { label: "Na", value: "121", tone: "critical" }],
    },
    blocks: [
      p("근위부 하지 근력이 뚜렷하게 떨어졌다.\n상지에도 약화가 시작된다.\n감각은 비교적 유지된다.\n호흡은 아직 안정적이다."),
      d("강수진", "“혈압도 계속 높습니다.”"),
      thought("decision", "시간이 줄고 있다.", 3),
    ],
    onEnter: [clue("progressive_motor_neuropathy"), clue("autonomic_instability"), log("motor-progression", "운동신경 약화 진행", "clinical", 1429)],
    choices: go("CASE_002"),
  },
  CASE_002: {
    id: "CASE_002",
    title: "증례 토의",
    presentation: { mode: "conference", titleStyle: "phase", titleCaption: "CASE CONFERENCE · 2", backdrop: "board" },
    blocks: [
      s("심한 복통\n변비\n빈맥 · 고혈압\n저나트륨혈증\n불면 · 지각 이상\n운동신경 약화"),
      s("CK 정상", [flag("hosp_ck_checked")]),
      s("혈중 납 · 진단적 수준 아님", [flag("hosp_lead_checked")]),
      thought("mechanism", "복통은 내장신경.\n\n빈맥과 고혈압은 자율신경.\n\n약화는 운동신경.\n\n혼란은 중추신경.\n\n나트륨은 그 사이에 끼어 있다."),
      thought("reasoning", "하나의 질환으로 묶는다."),
      voice("history", "금식.", [flag("restricted_diet_known")]),
      voice("suspicion", "호르몬.", [flag("ocp_known")]),
      voice("empathy", "이모.", [flag("family_history_known")]),
      voice("observation", "소변.", [flag("urine_color_known")]),
      thought("mechanism", "헴."),
    ],
    onEnter: [
      setFlag("acute_hepatic_porphyria_available"),
      ...differentials.map((id) => addDiagnosis(HARIN, id)),
      when([testIs("blood_lead", "pending")], [test(HARIN, "blood_lead", "negative"), log("lead-negative", "혈중 납: 진단적 수준 아님", "test")]),
    ],
    choices: go("CASE_003", "가설을 세운다"),
  },
};

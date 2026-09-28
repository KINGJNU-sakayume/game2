import type { Condition, Effect, StoryNode } from "@/game/types";
import {
  HYEJIN, SIWOO, addValue, at, clockTo, clue, d, flag, go, log, minutes, note, p, s, setFlag, test, thought, valueAtLeast, valueBelow, voice,
} from "./helpers";

const visited: Effect[] = [addValue("field_locations_visited", 1)];
const unvisited = (key: string): Condition[] => [flag(key, false)];
const inTime = (id: string, label: string, next: string, extra: Condition[] = []) => ({ id, label, next, conditions: [...extra, valueBelow("field_locations_visited", 2)] });
const late = (id: string, label: string, next: string, extra: Condition[] = []) => ({ id: `${id}-overstay`, label, next: `OVERSTAY_${next}`, conditions: [...extra, valueAtLeast("field_locations_visited", 2)] });
const overstay = (id: string, label: string, next: string): StoryNode => ({
  id,
  blocks: [thought("decision", "챔버는 두 시간이다.\n그 뒤에 두 사람이 어디로 갈지, 아직 아무도 정하지 않았다.")],
  choices: [
    { id: "continue-overstay", label, effects: [setFlag("field_overstay"), minutes(20)], next },
    { id: "return", label: "병원으로 돌아간다", next: "AFTER_001" },
  ],
});
const homeBack = [{ id: "return", label: "다른 곳을 본다", next: "HOME_002" }];

export const fieldNodes: Record<string, StoryNode> = {
  FIELD_GATE: {
    id: "FIELD_GATE",
    title: "노출원 추적",
    presentation: { titleStyle: "phase", titleCaption: "FIELD INVESTIGATION", backdrop: "rain", timeLabel: "10:05", prompt: "어디를 확인할까." },
    onEnter: [clockTo(at(10, 5)), { type: "timeline", entry: { id: "field-start", kind: "field", text: "노출원 추적 시작" } }],
    blocks: [
      voice("reasoning", "진단은 끝났다. 원인은 아직이다.", [flag("field_briefed", false)]),
      voice("decision", "두 시간 뒤, 두 사람은 어딘가로 돌아간다.\n그 방이 아니어야 한다.", [flag("field_briefed", false)]),
    ],
    onExit: [setFlag("field_briefed")],
    choices: [
      inTime("home", "시우네 집으로 간다", "HOME_001", unvisited("visited_home")),
      late("home", "시우네 집으로 간다", "HOME_001", unvisited("visited_home")),
      inTime("neighbor", "윗집 주민을 만난다", "NEIGH_001", unvisited("visited_neighbor")),
      late("neighbor", "윗집 주민을 만난다", "NEIGH_001", unvisited("visited_neighbor")),
      inTime("center", "지역아동센터에 전화한다", "CENTER_001", unvisited("called_center")),
      late("center", "지역아동센터에 전화한다", "CENTER_001", unvisited("called_center")),
      inTime("hospital", "병원에 남아 추가로 확인한다", "HOSP_001", unvisited("hospital_extra_done")),
      late("hospital", "병원에 남아 추가로 확인한다", "HOSP_001", unvisited("hospital_extra_done")),
      { id: "return", label: "병원으로 돌아간다", next: "AFTER_001" },
    ],
  },
  OVERSTAY_HOME_001: overstay("OVERSTAY_HOME_001", "그래도 집을 본다", "HOME_001"),
  OVERSTAY_NEIGH_001: overstay("OVERSTAY_NEIGH_001", "그래도 윗집을 찾아간다", "NEIGH_001"),
  OVERSTAY_CENTER_001: overstay("OVERSTAY_CENTER_001", "그래도 전화한다", "CENTER_001"),
  OVERSTAY_HOSP_001: overstay("OVERSTAY_HOSP_001", "그래도 추가로 확인한다", "HOSP_001"),

  // ── 반지하 ──────────────────────────────────────────────────────────────
  HOME_001: {
    id: "HOME_001",
    title: "반지하 102호",
    presentation: { assetId: "SCN2_002_SEMIBASEMENT", backdrop: "semibasement", location: "반지하 102호", titleStyle: "place" },
    blocks: [
      p("계단 여섯 개를 내려간다. 현관문 틈으로 더운 공기가 새어 나온다."),
      p("안에서 보일러가 돌아가는 소리가 난다. 아무도 없는데."),
      thought("decision", "지금 이 문을 열고 들어가면\n오늘의 세 번째 환자가 된다.", 3),
    ],
    choices: [
      { id: "safe", label: "119와 가스안전공사를 부르고, 밖에서 가스 밸브부터 잠근다", next: "HOME_SAFE" },
      { id: "rush", label: "숨을 참고 들어가 창문부터 연다", next: "HOME_RUSH" },
    ],
  },
  HOME_SAFE: {
    id: "HOME_SAFE",
    blocks: [
      p("계량기 옆 중간 밸브를 잠근다. 보일러 소리가 멈춘다."),
      p("십오 분 뒤 소방차가 골목 끝에 선다. 대원이 측정기를 들고 먼저 내려간다."),
      s("CO 측정 · 현관 앞 88 ppm"),
      d("소방대원", "“문 다 열고 들어가셔도 됩니다. 오래는 계시지 마시고요.”"),
    ],
    onEnter: [minutes(15), setFlag("scene_secured")],
    choices: go("HOME_002", "들어간다"),
  },
  HOME_RUSH: {
    id: "HOME_RUSH",
    blocks: [
      p("현관을 열고 창문으로 달려간다. 테이프가 잘 떨어지지 않는다."),
      p("세 번째 창문을 열 때쯤 관자놀이가 조여 온다."),
      thought("mechanism", "이 두통이 시우의 사흘이다.", 2),
      p("밖으로 나와 계단에 앉는다. 십 분 동안 일어나지 못한다."),
    ],
    onEnter: [minutes(10), setFlag("investigator_exposed"), setFlag("scene_secured")],
    choices: go("HOME_002", "다시 들어간다"),
  },
  HOME_002: {
    id: "HOME_002",
    presentation: {
      assetId: "SCN2_002_SEMIBASEMENT", backdrop: "semibasement", prompt: "무엇을 볼까.",
      hotspots: [
        { id: "home-boiler", label: "보일러실 조사", x: 18, y: 52, width: 14, height: 30, choiceId: "boiler", icon: "object" },
        { id: "home-window", label: "창문 조사", x: 52, y: 16, width: 30, height: 12, choiceId: "window", icon: "environment" },
        { id: "home-cage", label: "케이지 조사", x: 78, y: 70, width: 12, height: 14, choiceId: "cage", icon: "object" },
      ],
    },
    blocks: [p("장판은 아직 축축하다. 벽지는 무릎 높이까지 부풀어 있다.", [flag("home_room_seen", false)])],
    onExit: [setFlag("home_room_seen")],
    choices: [
      { id: "boiler", label: "보일러실 문을 연다", conditions: unvisited("home_boiler_seen"), next: "HOME_BOILER" },
      { id: "window", label: "창문을 본다", conditions: unvisited("home_window_seen"), next: "HOME_WINDOW" },
      { id: "cage", label: "현관 옆 케이지를 본다", conditions: unvisited("home_cage_seen"), next: "HOME_CAGE" },
      { id: "sticker", label: "보일러 점검 스티커를 확인한다", conditions: [flag("home_boiler_seen"), flag("home_sticker_seen", false)], next: "HOME_STICKER" },
      { id: "leave", label: "집 조사를 마친다", next: "HOME_EXIT" },
    ],
  },
  HOME_BOILER: {
    id: "HOME_BOILER",
    presentation: { assetId: "EVD2_001_FLUE" },
    blocks: [
      p("보일러실은 현관 바로 옆, 시우 방과 벽 하나를 사이에 두고 있다."),
      p("배기통 이음새가 빠져 있다. 연통이 벽 쪽으로 기울어 있고, 이음새 둘레가 까맣다."),
      d("소방대원", "“물 차면서 보일러가 들렸다가 내려앉은 거예요. 그때 빠진 거죠.”", [flag("scene_secured")]),
      thought("mechanism", "배기가스가 밖이 아니라 방으로 나왔다.\n사흘 동안, 밤낮없이.", 2),
    ],
    onEnter: [minutes(6), setFlag("home_boiler_seen"), setFlag("flue_found"), clue("flue_dislodged"), log("flue", "보일러 배기통 이탈 확인", "field")],
    choices: homeBack,
  },
  HOME_WINDOW: {
    id: "HOME_WINDOW",
    presentation: { assetId: "EVD2_002_TAPED_WINDOW" },
    blocks: [
      p("창문 틈마다 청테이프가 두 겹으로 붙어 있다."),
      p("창틀 밑으로 하수구 냄새가 아직 올라온다."),
      thought("empathy", "냄새를 막으려고, 무서워서 막았다.\n막으면 안 되는 것까지 같이.", 3),
    ],
    onEnter: [minutes(4), setFlag("home_window_seen"), setFlag("ventilation_known"), clue("windows_closed")],
    choices: homeBack,
  },
  HOME_CAGE: {
    id: "HOME_CAGE",
    presentation: { assetId: "EVD2_003_CAGE" },
    blocks: [
      p("현관 옆 바닥, 보일러실 문 바로 앞에 케이지가 있다."),
      p("톱밥 위에 작고 동그란 몸."),
      note("케이지 이름표\n보리 · 2살 · 해바라기씨 좋아함"),
      thought("mechanism", "몸이 작을수록 숨이 빠르다.\n가장 먼저 쓰러지는 건 가장 작은 것.", 3),
    ],
    onEnter: [minutes(3), setFlag("home_cage_seen"), setFlag("hamster_known"), clue("dead_pet")],
    choices: homeBack,
  },
  HOME_STICKER: {
    id: "HOME_STICKER",
    blocks: [note("가스보일러 정기점검\n최종 점검일 · 2019. 04."), thought("suspicion", "점검은 오 년 전에 멈췄다.", 2)],
    onEnter: [setFlag("home_sticker_seen"), clue("old_inspection")],
    choices: homeBack,
  },
  HOME_EXIT: {
    id: "HOME_EXIT",
    blocks: [
      p("나오는 길에 가스안전공사 직원이 보일러에 사용중지 딱지를 붙인다.", [flag("flue_found")]),
      p("현관문을 닫는다. 이 방이 무엇을 하고 있었는지는 아직 모른다.", [flag("flue_found", false)]),
    ],
    onEnter: [setFlag("visited_home"), ...visited],
    choices: go("FIELD_RETURN"),
  },

  // ── 윗집 ────────────────────────────────────────────────────────────────
  NEIGH_001: {
    id: "NEIGH_001",
    presentation: { backdrop: "hallway", location: "1층 101호" },
    blocks: [
      p("1층 할머니가 현관에 선 채로 문을 반만 연다."),
      d("오말순", "“그 집 애 엄마? 병원에 갔다고?”"),
      d("오말순", "“나도 요 며칠 머리가 띵해서 약 먹었어. 보일러 소리가 밤새 나더라고.”"),
      thought("reasoning", "배기구가 이 집 창문 밑으로 나 있다.", 3),
    ],
    choices: [
      { id: "warn", label: "“오늘은 창문을 열어두시고, 두통이 계속되면 바로 병원에 오세요.”", effects: [setFlag("neighbor_warned")], next: "NEIGH_002" },
      { id: "ask", label: "그 집 사정을 더 묻는다", next: "NEIGH_002" },
    ],
  },
  NEIGH_002: {
    id: "NEIGH_002",
    blocks: [
      d("오말순", "“그 집 엄마가 밤마다 일 나가. 애 혼자 자.”"),
      d("오말순", "“주인한테 보일러 봐달라고 몇 번 했다던데, 물난리 났다고 다들 정신없지.”"),
      thought("empathy", "혼자 자는 아이, 혼자 버티는 엄마.", 3),
    ],
    onEnter: [setFlag("neighbor_exposed"), clue("neighbor_symptoms"), setFlag("child_alone_known"), clue("child_alone_nights"), setFlag("visited_neighbor"), ...visited],
    choices: go("FIELD_RETURN"),
  },

  // ── 지역아동센터 ────────────────────────────────────────────────────────
  CENTER_001: {
    id: "CENTER_001",
    presentation: { backdrop: "phone" },
    blocks: [
      d("이다은", "“시우요? 낮에는 괜찮아요. 아침에만 처져서 와요.”"),
      d("이다은", "“점심 먹고 나면 멀쩡해져요. 요 며칠 계속 그랬어요.”"),
      d("이다은", "“보리가 이상하다고, 밥을 안 먹는다고 걱정했어요.”"),
      thought("reasoning", "집을 떠나면 나아진다.\n그 한 줄이 진단이다.", 2),
    ],
    onEnter: [clue("morning_worse"), setFlag("hamster_known"), setFlag("called_center"), ...visited],
    choices: go("FIELD_RETURN"),
  },

  // ── 병원 ────────────────────────────────────────────────────────────────
  HOSP_001: {
    id: "HOSP_001",
    presentation: { backdrop: "er", location: "소아응급 03", prompt: "무엇을 확인할까." },
    blocks: [],
    choices: [
      { id: "repeat", label: "COHb를 다시 잰다", conditions: unvisited("repeat_cohb_done"), next: "HOSP_REPEAT" },
      { id: "hcg", label: "보호자 임신 여부를 확인한다", conditions: unvisited("bhcg_done"), next: "HOSP_HCG" },
      { id: "cog", label: "기준 신경인지 선별검사를 한다", conditions: unvisited("baseline_cog_done"), next: "HOSP_COG" },
      { id: "finish", label: "확인을 마친다", effects: [setFlag("hospital_extra_done"), ...visited], next: "FIELD_RETURN" },
    ],
  },
  HOSP_REPEAT: {
    id: "HOSP_REPEAT",
    blocks: [s("COHb 재검\n박시우 7% · 정혜진 9%"), thought("mechanism", "떨어진다. 숫자는 늘 먼저 좋아진다.", 3)],
    onEnter: [minutes(5), setFlag("repeat_cohb_done")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  HOSP_HCG: {
    id: "HOSP_HCG",
    blocks: [s("소변 β-hCG · 정혜진 · 음성"), thought("mechanism", "태아의 헤모글로빈은 일산화탄소를 더 오래 붙잡는다.\n확인해야 하는 질문이었다.", 3)],
    onEnter: [minutes(5), setFlag("bhcg_done"), test(HYEJIN, "bhcg", "negative")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  HOSP_COG: {
    id: "HOSP_COG",
    blocks: [p("기억, 주의력, 따라 그리기. 오늘의 기준점을 남겨둔다."), thought("decision", "몇 주 뒤에 나타나는 후유증이 있다.\n오늘을 적어둬야 그날과 비교할 수 있다.", 3)],
    onEnter: [minutes(10), setFlag("baseline_cog_done"), test(SIWOO, "neurocog", "ordered")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  FIELD_RETURN: {
    id: "FIELD_RETURN",
    presentation: { prompt: "다음은." },
    blocks: [p("알아낸 것들을 정리한다."), p("두 곳을 확인했다. 챔버가 끝날 시간이 가깝다.", [valueAtLeast("field_locations_visited", 2)])],
    choices: [{ id: "investigate", label: "다른 곳을 확인한다", next: "FIELD_GATE" }, { id: "hospital", label: "병원으로 돌아간다", next: "AFTER_001" }],
  },
};


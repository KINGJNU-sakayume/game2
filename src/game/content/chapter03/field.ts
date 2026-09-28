import type { Condition, Effect, StoryNode } from "@/game/types";
import {
  SUNRYE, addValue, at, clockTo, clue, d, flag, go, memoryVoice, minutes, p, s, setFlag, test, thought, valueAtLeast, valueBelow, voice,
} from "./helpers";

const MORNING = at(8, 30) + 1440;
const visited: Effect[] = [addValue("field_locations_visited", 1)];
const unvisited = (key: string): Condition[] => [flag(key, false)];
const inTime = (id: string, label: string, next: string, extra: Condition[] = []) => ({ id, label, next, conditions: [...extra, valueBelow("field_locations_visited", 2)] });
const late = (id: string, label: string, next: string, extra: Condition[] = []) => ({ id: `${id}-overstay`, label, next: `OVERSTAY_${next}`, conditions: [...extra, valueAtLeast("field_locations_visited", 2)] });
const overstay = (id: string, label: string, next: string): StoryNode => ({
  id,
  blocks: [thought("decision", "순례는 중환자실 앞에서 딸을 기다리고 있다.\n전화기 너머보다 침대 옆이 먼저다.")],
  choices: [
    { id: "continue-overstay", label, effects: [setFlag("field_overstay"), minutes(30)], next },
    { id: "return", label: "병상으로 돌아간다", next: "RESPONSE_001" },
  ],
});
const photoBack = [{ id: "return", label: "다른 사진을 본다", next: "PHOTOS_001" }];

export const fieldNodes: Record<string, StoryNode> = {
  FIELD_GATE: {
    id: "FIELD_GATE",
    title: "풀밭 추적",
    presentation: { titleStyle: "phase", titleCaption: "FIELD INVESTIGATION", backdrop: "village", timeLabel: "08:30", location: "감염내과 의국", prompt: "무엇을 확인할까." },
    onEnter: [clockTo(MORNING), { type: "timeline", entry: { id: "field-start", kind: "field", text: "노출 경로 추적 시작" } }],
    blocks: [
      voice("reasoning", "상월리는 세 시간 거리다.\n대신 딸의 휴대폰과 전화 두 통이 있다.", [flag("field_briefed", false)]),
      voice("decision", "같은 풀밭에 앉았던 사람이 또 있을 수 있다.", [flag("field_briefed", false)]),
    ],
    onExit: [setFlag("field_briefed")],
    choices: [
      inTime("photos", "수경의 추석 사진을 본다", "PHOTOS_001", unvisited("photos_done")),
      late("photos", "수경의 추석 사진을 본다", "PHOTOS_001", unvisited("photos_done")),
      inTime("neighbor", "영자 할머니에게 전화한다", "NEIGH_CALL", unvisited("neighbor_called")),
      late("neighbor", "영자 할머니에게 전화한다", "NEIGH_CALL", unvisited("neighbor_called")),
      inTime("clinic", "처방한 의원에 전화한다", "CLINIC_CALL", unvisited("clinic_called")),
      late("clinic", "처방한 의원에 전화한다", "CLINIC_CALL", unvisited("clinic_called")),
      inTime("hospital", "병원에서 추가로 확인한다", "HOSP_001", unvisited("hospital_extra_done")),
      late("hospital", "병원에서 추가로 확인한다", "HOSP_001", unvisited("hospital_extra_done")),
      { id: "return", label: "병상으로 돌아간다", next: "RESPONSE_001" },
    ],
  },
  OVERSTAY_PHOTOS_001: overstay("OVERSTAY_PHOTOS_001", "그래도 사진을 본다", "PHOTOS_001"),
  OVERSTAY_NEIGH_CALL: overstay("OVERSTAY_NEIGH_CALL", "그래도 전화한다", "NEIGH_CALL"),
  OVERSTAY_CLINIC_CALL: overstay("OVERSTAY_CLINIC_CALL", "그래도 전화한다", "CLINIC_CALL"),
  OVERSTAY_HOSP_001: overstay("OVERSTAY_HOSP_001", "그래도 확인한다", "HOSP_001"),

  // ── 추석 사진 ───────────────────────────────────────────────────────────
  PHOTOS_001: {
    id: "PHOTOS_001",
    presentation: { backdrop: "ward", location: "보호자 면담실", prompt: "어느 사진을 볼까." },
    blocks: [d("이수경", "“추석 때 찍은 거예요. 엄마는 사진 찍히는 거 싫어해서 몇 장 없어요.”", [flag("photos_opened", false)])],
    onExit: [setFlag("photos_opened")],
    choices: [
      { id: "grave", label: "산소 앞 사진", conditions: unvisited("photo_grave_seen"), next: "PHOTO_GRAVE" },
      { id: "dog", label: "옆집 개 사진", conditions: unvisited("photo_dog_seen"), next: "PHOTO_DOG" },
      { id: "paddy", label: "논 사진", conditions: unvisited("photo_paddy_seen"), next: "PHOTO_PADDY" },
      { id: "store", label: "창고 사진", conditions: unvisited("photo_store_seen"), next: "PHOTO_STORE" },
      { id: "done", label: "휴대폰을 돌려준다", effects: [setFlag("photos_done"), ...visited], next: "FIELD_RETURN" },
    ],
  },
  PHOTO_GRAVE: {
    id: "PHOTO_GRAVE",
    presentation: { assetId: "EVD3_002_GRAVE_PHOTO" },
    blocks: [
      p("벌초를 마친 봉분 앞. 순례와 영자가 잔디에 나란히 앉아 도시락을 먹고 있다."),
      p("반팔. 맨손. 돗자리 없이."),
      thought("mechanism", "털진드기 유충은 풀잎 끝에서 기다린다.\n앉는 순간, 옷 속으로 들어온다.", 2),
    ],
    onEnter: [setFlag("photo_grave_seen"), setFlag("grass_exposure_known"), clue("beolcho")],
    choices: photoBack,
  },
  PHOTO_DOG: {
    id: "PHOTO_DOG",
    presentation: { assetId: "EVD3_003_DOG_PHOTO" },
    blocks: [p("영자네 누렁이. 귀 안쪽에 까만 점이 몇 개 붙어 있다."), thought("reasoning", "참진드기. SFTS를 옮기는 쪽이다.", 3), thought("suspicion", "개는 가까이 있었다. 그렇다고 개가 답은 아니다.", 3)],
    onEnter: [setFlag("photo_dog_seen"), clue("dog_ticks")],
    choices: photoBack,
  },
  PHOTO_PADDY: {
    id: "PHOTO_PADDY",
    presentation: { assetId: "EVD3_004_PADDY_PHOTO" },
    blocks: [p("비 그친 다음 날의 논. 순례가 장화도 없이 물꼬를 트고 있다."), thought("reasoning", "고인 물, 쥐 오줌. 렙토스피라의 무대다.", 3)],
    onEnter: [setFlag("photo_paddy_seen"), clue("rice_paddy")],
    choices: photoBack,
  },
  PHOTO_STORE: {
    id: "PHOTO_STORE",
    presentation: { assetId: "EVD3_005_STORE_PHOTO" },
    blocks: [p("정리 중인 창고. 가마니 옆에 쥐똥이 흩어져 있다."), thought("reasoning", "등줄쥐. 한탄바이러스.", 3), thought("mechanism", "가을의 열은 다 이 세 곳 중 하나에서 온다.\n딱지는 그중 풀밭을 가리킨다.", 4)],
    onEnter: [setFlag("photo_store_seen"), clue("storehouse_mice")],
    choices: photoBack,
  },

  // ── 영자 할머니 ─────────────────────────────────────────────────────────
  NEIGH_CALL: {
    id: "NEIGH_CALL",
    presentation: { backdrop: "phone" },
    blocks: [
      d("박영자", "“순례가 입원을 했어? 아이고.”"),
      d("박영자", "“나도 사흘째 열이 나. 감기겠지 뭐. 읍내 의원에서 약 타왔어.”"),
      memoryVoice("patient_is_never_one", "환자는 한 명이 아니다."),
      thought("reasoning", "같은 날, 같은 풀밭, 같은 도시락.", 2),
    ],
    choices: [
      { id: "warn", label: "“오늘 바로 큰 병원에 가세요. 추석에 벌초했다고 꼭 말씀하시고, 몸에 딱지가 있는지 봐달라고 하세요.”", effects: [setFlag("neighbor_warned")], next: "NEIGH_DONE" },
      { id: "reassure", label: "“감기면 푹 쉬세요.”", next: "NEIGH_DONE" },
    ],
  },
  NEIGH_DONE: {
    id: "NEIGH_DONE",
    blocks: [
      d("박영자", "“딱지? …허리춤에 뭐가 있긴 하던데.”", [flag("neighbor_warned")]),
      d("박영자", "“그래, 약 먹고 누워 있을게.”", [flag("neighbor_warned", false)]),
      voice("decision", "전화는 끝났다. 할머니의 열은 끝나지 않았다.", [flag("neighbor_warned", false)]),
    ],
    onEnter: [setFlag("neighbor_called"), clue("neighbor_fever"), ...visited],
    choices: go("FIELD_RETURN"),
  },

  // ── 의원 ────────────────────────────────────────────────────────────────
  CLINIC_CALL: {
    id: "CLINIC_CALL",
    presentation: { backdrop: "phone" },
    blocks: [
      d("황보성", "“문순례 님요? 네, 세픽심 드렸죠. 목이 좀 붓고 열이 나셔서.”"),
      d("황보성", "“가을이면 쯔쯔가무시 한 번씩 생각은 하는데… 딱지를 못 봤어요. 옷을 다 벗기긴 어렵잖아요, 어르신들.”"),
      d("황보성", "“알로퓨리놀은 읍내 다른 데서 받으신 거고요.”"),
      thought("empathy", "그 의사도 같은 문 앞에서 멈췄다.\n나도 멈출 뻔했다.", 3),
    ],
    onEnter: [setFlag("clinic_called"), clue("cephalosporin_failure"), ...visited],
    choices: go("FIELD_RETURN"),
  },

  // ── 병원 ────────────────────────────────────────────────────────────────
  HOSP_001: {
    id: "HOSP_001",
    presentation: { backdrop: "hallway", location: "감염내과 의국", prompt: "무엇을 확인할까." },
    blocks: [],
    choices: [
      { id: "sfts", label: "SFTS 결과를 확인하고 격리를 조정한다", conditions: [flag("sfts_sent"), flag("sfts_checked", false)], next: "HOSP_SFTS" },
      { id: "ifa", label: "IFA 항체를 보내 둔다", conditions: unvisited("ifa_sent"), next: "HOSP_IFA" },
      { id: "culture", label: "배양 결과를 확인한다", conditions: unvisited("culture_checked"), next: "HOSP_CULTURE" },
      { id: "finish", label: "확인을 마친다", effects: [setFlag("hospital_extra_done"), ...visited], next: "FIELD_RETURN" },
    ],
  },
  HOSP_SFTS: {
    id: "HOSP_SFTS",
    blocks: [s("SFTS RT-PCR · 음성"), d("강수진", "“격리 풀어도 되겠네요.”"), thought("reasoning", "배제는 확인이 아니지만, 이번엔 문 하나를 닫아도 된다.", 3)],
    onEnter: [minutes(5), setFlag("sfts_checked"), test(SUNRYE, "sfts_pcr", "negative"), clue("sfts_negative")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  HOSP_IFA: {
    id: "HOSP_IFA",
    blocks: [p("혈청을 보낸다. 두 주 뒤 한 번 더 뽑아 비교한다."), thought("mechanism", "항체는 오늘보다 두 주 뒤에 진실을 말한다.\n치료는 그걸 기다리지 않았다.", 3)],
    onEnter: [minutes(5), setFlag("ifa_sent"), test(SUNRYE, "scrub_ifa", "pending")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  HOSP_CULTURE: {
    id: "HOSP_CULTURE",
    blocks: [s("혈액 배양 · 48시간 무성장\n소변 배양 · 무성장"), thought("reasoning", "요로감염은 이제 설명이 아니다.", 2)],
    onEnter: [minutes(5), setFlag("culture_checked"), test(SUNRYE, "blood_culture", "negative")],
    choices: [{ id: "back", label: "다른 것도 확인한다", next: "HOSP_001" }],
  },
  FIELD_RETURN: {
    id: "FIELD_RETURN",
    presentation: { prompt: "다음은." },
    blocks: [p("알아낸 것들을 차트에 옮긴다."), p("두 가지를 확인했다. 병상으로 돌아갈 시간이다.", [valueAtLeast("field_locations_visited", 2)])],
    choices: [{ id: "investigate", label: "다른 것을 확인한다", next: "FIELD_GATE" }, { id: "back", label: "병상으로 돌아간다", next: "RESPONSE_001" }],
  },
};

export const chapter03FieldTiming = { MORNING } as const;

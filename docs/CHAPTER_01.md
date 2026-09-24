# CHAPTER 1 — 아무것도 없는 배

## Canonical Content Source v1.0

> 이 문서는 Chapter 1의 구현 기준(source of truth)이다.
> Codex는 대사, 분기, 상태 변화, 노드 의미를 임의로 축약·수정·추가하지 않는다.
> 현재 첫 구현 범위는 **PR_001 ~ ER_002**까지만이다.

---

# 0. 런타임 초기 상태

```text
time = 19:42

trust = 40
disease_stage = 0

primary_dx = null

visited_apartment = false
visited_rehearsal = false
contacted_family = false

restricted_diet_known = false
ocp_known = false
family_history_known = false
previous_attacks_known = false
early_weakness_known = false
urine_color_known = false

aip_available = false
acute_porphyria_suspected = false

pbg_ordered = false
pbg_positive = false
hemin_started = false

family_boundary_broken = false
patient_apology_given = false
```

능력 ID:

```text
OBS = observation
HIS = history
EMP = empathy
MEC = mechanism
REA = reasoning
SUS = suspicion
DEC = decision
```

능동 판정 공식:

```text
2d6 + ability + modifiers >= DC
```

---

# ACT 0 — PROLOGUE

## PR_001 — 암전

**UI**
- immersive
- hideTime: true
- hideCase: true
- image: none

**Narrative**

완전한 검정.

멀리서 피아노 한 음이 들린다.

무대감독:

> “다시 갈게요. 47마디부터.”

**Input**

화면 탭.

**Next**

`PR_002`

---

## PR_002 — 리허설

**UI**
- image key: `rehearsal`
- cinematic
- hideCase: true

**Narrative**

조명이 켜진다.

앙상블 배우들이 빈 객석을 향해 군무를 반복한다.

윤하린은 그중 한 명이다.

박자.

한 번.

두 번.

오른손이 잠깐 배로 내려간다.

다시 원래 자세.

**Passive check**

조건:

```text
observation >= 3
```

성공 시 내면:

> **◉ 관찰**
>
> 한 동작이 반 박자 늦었다.

실패 시 아무 추가 문장 없음.

**Next**

`PR_003`

---

## PR_003 — 이상

정세영:

> “괜찮아?”

윤하린:

> “응.”

피아노가 계속된다.

하린이 다시 움직인다.

이번에는 두 걸음 만에 멈춘다.

숨을 깊게 들이마신다.

**Next**

`PR_004`

---

## PR_004 — 붕괴

하린의 무릎이 꺾인다.

무대 바닥.

세영:

> “하린아?”

하린:

> “잠깐만…”

세영:

> “119 부를게.”

하린:

> “아니. 괜찮—”

말이 끊긴다.

하린이 배를 움켜쥔다.

> “또 시작됐어.”

**Effect**

```text
clue_previous_episode_hint = true
```

이 플래그는 아직 플레이어의 정식 단서 목록에 표시하지 않는다.

**Next**

`PR_005`

---

## PR_005 — 전화

**UI**
- image: none
- hideCase: true

암전.

```text
19:42
```

전화 진동.

목소리:

> “진단팀 맞으시죠?”

> “28세 여성입니다.”

> “복통이 굉장히 심한데… 지금까지 설명이 잘 안 됩니다.”

**Next**

`PR_006`

---

## PR_006 — TITLE

화면 중앙:

```text
CHAPTER 1

아무것도 없는 배
```

약 1.5초 유지 후 자동 전환.

**Next**

`ER_001`

---

# ACT 1 — FIRST CONTACT

## ER_001 — 19:55 응급실

**UI**
- time: 19:55
- location: 응급실 07
- image key: `erInitial`

**Clinical data**

```text
HR 118
BP 168/102
T 36.7
```

**Narrative**

강수진:

> “리허설 도중 쓰러졌습니다.”

> “복통 9점.”

> “구토 한 번.”

> “임신반응은 음성입니다.”

하린은 몸을 약간 웅크린 채 플레이어를 본다.

윤하린:

> “또 설명해야 돼요?”

### Choice A

> “제가 처음 듣습니다. 처음부터 말해주세요.”

Effect:

```text
trust +4
```

Next: `ER_002`

### Choice B

> “필요한 것만 확인하겠습니다.”

Effect 없음.

Next: `ER_002`

### Choice C

> “많이 아프죠?”

Effect:

```text
trust -1
```

결과 대사:

윤하린:

> “그 질문 오늘 네 번째예요.”

Next: `ER_002`

---

## ER_002 — 첫 질문 선택

이 노드는 **hub node**다.

한 번의 `enterNode` 안에서 자동 순환하는 노드가 아니다.
플레이어 선택으로 하위 문진 노드에 진입한 뒤, 해당 문진 완료 후 다시 `ER_002`로 명시적으로 돌아올 수 있어야 한다.

### 선택지

1. `[통증에 대해 묻는다]`
   - Next: `ER_PAIN_01`

2. `[소화기 증상을 묻는다]`
   - Next: `ER_GI_01`

3. `[약물과 과거력을 확인한다]`
   - Next: `ER_MED_01`

4. `[최근 생활을 묻는다]`
   - Next: `ER_LIFE_01`

### 진행 규칙

- 처음 3개 카테고리를 완료하면 다음 단계 `ER_003` 진입 선택지를 노출한다.
- 4개를 모두 확인하는 것도 허용한다.
- 이 hub에서 질문 카테고리를 반복 선택해서 같은 콘텐츠를 무한 재생하지 않도록 완료 플래그를 사용한다.
- 완료된 카테고리는 숨기거나 비활성화할 수 있으나, 게임 디자인상 별도 점수나 “완료 3/4” 숫자는 노출하지 않는다.
- 첫 프로토타입에서는 `ER_003` 이후 내용은 구현하지 않는다.

---

# 이후 Chapter 1 전체 플롯 잠금 요약

다음 내용은 향후 milestone에서 구현하며 현재 PR_001~ER_002 vertical slice에서는 작성만 하고 실행하지 않는다.

```text
ER_002
  ↓
문진 / 신체진찰
  ↓
기본검사: Na 128
  ↓
복부 CT: 설명 가능한 구조 병변 없음
  ↓
과거 진료기록
  ↓
Case Conference 1
  ↓
Na 124 + 초기 근력저하
  ↓
재문진
  ↓
Field Investigation
  ├─ 하린의 집
  │   ├─ 거의 비어 있는 냉장고
  │   ├─ 체중 기록
  │   └─ 경구피임약
  ├─ 연습실
  │   ├─ 극단적 식사 제한
  │   ├─ 물병 뚜껑을 못 연 과거 근력저하
  │   └─ 납 노출 red herring
  ├─ 가족
  │   └─ 모계 이모의 반복 복통/신경정신 증상
  └─ 병원 추가검사
  ↓
Na 121 + 지각 이상 + 진행성 운동신경 약화
  ↓
Case Conference 2
  ↓
감별
  ├─ 납중독
  ├─ 길랭-바레증후군
  ├─ 갈색세포종
  ├─ 기능성/정신과적 원인
  └─ 급성 간성 포르피린증
  ↓
증상 발생 중 urine PBG / ALA
  ↓
PBG markedly elevated
  ↓
급성 간성 포르피린증 확인
  ↓
진행성 신경증상을 고려한 hemin 치료
  ↓
회복
  ↓
추가검사에서 HMBS 병적 변이
  ↓
최종 진단: Acute Intermittent Porphyria
  ↓
Ending A~E
```

---

# 엔딩 축

```text
Diagnosis:
- appropriate
- late
- failed

Treatment:
- appropriate
- delayed

Trigger:
- sufficient
- partial
- unknown

Relationship:
- trusted
- guarded
- broken
```

Priority:

```text
1. Diagnosis failed → END_E
2. Severe diagnostic/treatment delay → END_B
3. Relationship broken → END_C
4. Trigger unknown → END_D
5. Otherwise → END_A
```

---

# Chapter 1 고정 작가 규칙

1. 핵심 단서는 단일 판정 하나 뒤에 가두지 않는다.
2. 실패는 콘텐츠 삭제가 아니라 경로 변경, 시간 비용, 관계 변화다.
3. 검사 정상은 정보이지 결론이 아니다.
4. 환자와 진단은 별도의 성공 축이다.
5. 능력치는 정답을 알려주는 기능이 아니라 무엇을 보며 어떻게 생각하는지를 바꾼다.
6. 합리적인 오진은 실제 임상 근거를 가져야 한다.
7. Trust, Disease Stage, 정답 확률 등의 내부 수치를 플레이어에게 직접 표시하지 않는다.
8. 세계는 플레이어의 선택을 기억한다.
9. PBG 상승은 급성 간성 포르피린증의 생화학적 확인으로 사용하며, AIP 아형은 후속 HMBS 검사로 확정한다.
10. 첫 플레이에서 이전 선택으로 되돌리는 기능은 제공하지 않는다.

---

# 첫 vertical slice의 Acceptance Criteria

PR_001부터 ER_002까지만 구현했을 때 다음을 만족해야 한다.

- 앱 시작 후 PR_001부터 진행된다.
- PR_001~PR_006이 순서대로 정상 전환된다.
- observation 3 이상/미만에서 PR_002의 수동 내면 대사가 정확히 갈린다.
- ER_001에서 3개 선택지가 표시된다.
- 선택에 따라 trust 내부값이 정확히 변화한다.
- Trust 숫자는 플레이어에게 표시되지 않는다.
- ER_002에서 4개 질문 카테고리가 표시된다.
- 새로고침 후 현재 노드와 trust, RNG/check state가 보존된다.
- 브라우저 저장 실패가 발생해도 in-memory 플레이는 계속될 수 있다.
- 해당 범위에서 console/runtime error가 없어야 한다.

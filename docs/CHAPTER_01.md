# CHAPTER 1 — 아무것도 없는 배

## Canonical Content Source v2.1

> 이 문서는 Chapter 1의 구현 기준(source of truth)이다.
> 대사, 분기, 상태 변화, 노드 의미를 임의로 축약·수정·추가하지 않는다. 바꿀 때는 아래 개정 기록에 먼저 적는다.
> 현재 canonical 범위는 **PR_001 ~ CASE_COMPLETE**이며, 구현 노드 ID와 상태 전이는 본 문서를 따른다.
> 본문(v2.0)과 개정 기록(v2.1)이 다르면 **개정 기록이 우선**한다.

---

# v2.1 개정 기록 (2026-09)

v2.0을 실제로 플레이하며 검토한 결과, 설계 의도가 도달 불가능하거나 서로 모순되는 곳을 고쳤다. 노드 ID와 엔딩 체계는 그대로다.

## 도달할 수 없던 경로

| 위치 | v2.0 | v2.1 | 이유 |
| --- | --- | --- | --- |
| `ER_MED_01` 범위 넓히기 → `ER_MED_02` | 신뢰 ≥ 55 | 신뢰 ≥ **44** (`MED_BROADEN_TRUST`) | 첫 접촉 시점 최대 신뢰는 40 + 4. 55는 어떤 플레이로도 불가능했다. "처음부터 말해주세요"로 연 플레이어에게 열린다 |
| `ER_010` 피임약 고백 | (신뢰 ≥ 65 또는 `medication_incomplete`) 그리고 신뢰 ≥ 75 | (신뢰 ≥ 60 또는 `medication_incomplete`) 그리고 신뢰 ≥ **60** | 75는 사실상 도달 불가. 호르몬 촉발 요인(`ocp_known`)을 병원 안에서 얻는 길을 살렸다. 집 · 연습실 조사로도 얻을 수 있다 |

## 모순과 반복

- **`EP_002` 후속 기록**: 신뢰 60 이상이면서 경계를 넘은 경우 "오늘 물병 혼자 열었어요" 메시지와 "후속 진료가 다른 진료팀으로" 문장이 동시에 나왔다. `follow_up_transferred` 플래그로 둘 중 하나만 나온다. 메시지는 메모 카드(`note`)로 보인다.
- **허브 도입부**: `FIELD_GATE` 등 허브로 돌아올 때마다 같은 도입 대사가 반복됐다. 첫 방문에만 나온다(`field_gate_briefed`, `hosp_extra_started` 등).
- **병원 추가 확인** (`HOSP_EXTRA_001`): 검사를 고르면 `pending`만 남고 결과가 없었다. 이제 각 검사가 결과 노드를 가진다 — 혈중 납(외부 의뢰), 전해질 재검 Na 123(진행하는 저나트륨), CK 96 정상, 심전도 동성빈맥 122 · QTc 468, 소변 Na 58 · 삼투압 510(SIADH 부합).
- **늦은 진단**: 진단이 늦어도 기록되지 않았다. 소변 PBG/ALA를 다음 날 00:30(`LATE_DIAGNOSIS_AT`) 이후에 의뢰하면(`TEST_PBG_01`) `diagnosis_outcome = "late"`가 되고 엔딩 B로 간다.

## 장면으로 다시 쓴 부분

설명(`EXPLAIN_*`), 퇴원, 17일 후, 다섯 엔딩은 "적절한 진단과 치료가 함께 보존됐다" 같은 요약 문장이었다. 같은 의미를 인물의 행동과 대사로 보여주는 장면으로 바꿨다. 엔딩 제목은 그대로다: 이름을 되찾다 / 늦게 도착한 정답 / 병은 찾고 사람은 잃다 / 절반의 진단 / 정상 검사라는 함정.

## 표기와 진행

- 한 걸음 진행("계속", "화면 탭")은 버튼이 아니라 화면 탭이다. 허브 복귀는 "다른 질문으로 돌아간다", "다른 진찰로 돌아간다".
- 화자 이름을 인물 목록과 맞췄다: 세영 → 정세영, 하린 → 윤하린, 플레이어 → 나.
- 속마음 라벨(`◉ 관찰`)은 텍스트에 쓰지 않고 능력 데이터에서 만든다.
- 결과 규칙(`chapter01Outcomes`): 유발 요인 = 심한 열량 제한(`restricted_diet_known`) + 호르몬 노출(`ocp_known`), 관계 = 윤하린 신뢰(20 / 60), 경계 `family_boundary_broken`, 회복 `patient_apology_given`.

## 에셋

`CIN_001_REHEARSAL`, `CIN_002_COLLAPSE`, `EVD_002_FRIDGE` 파일은 이미지가 아니라 가져오기 오류 문자열이었다. 삭제하고 `status: "missing"`으로 선언했다. `SCN_007_RECOVERY`는 처음부터 파일이 없었다. 대체 연출은 `VISUAL_BIBLE.md`의 샷 리스트를 따른다.

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


---

# ACT 1–3 — 구현된 조사 및 진단 흐름

초기 문진/진찰, CT, 과거기록과 첫 Case Conference 이후의 canonical node chain은 다음과 같다. 이 구간의 잠긴 대사와 세부 선택은 코드의 동일 ID 노드를 기준으로 하며 축약해 재작성하지 않는다.

```text
ER_001 → ER_002 (문진 hub) → ER_003 (진찰 hub) → ER_004…ER_010
→ CT_001…CT_003 → RECORDS / CASE_001
→ FIELD_GATE → APT_* / REH_* / FAM_* / HOSP_EXTRA_*
→ FIELD_RETURN → DET_001 → DET_002 → DET_003 → CASE_002 → CASE_003
```

`CASE_003`의 감별 경로는 `DX_LEAD_*`, `DX_GBS_01`, `DX_PHEO_01`, `DX_TOXIC_01`, `DX_PSYCH_*`, `DX_PORPH_01`이다. Acute hepatic porphyria를 선택하면 `TEST_PORPH_01`에서 급성기 생화학 검사인 urine PBG/ALA를 주문하여 `TEST_PBG_01 → WAIT_001`로 진행한다. 유전자검사는 급성기 결과를 대신하지 않는다. 소변 색은 보조 단서일 뿐 진단 기준이 아니다.

정신과적 가설에 anchoring한 경우 `DX_PSYCH_REVIEW`에서 PBG 검사를 보류할 수 있고, 이는 `FAIL_001`로 이어진다.

# ACT 4 — 치료 결정과 생화학적 확인

## WAIT_001

근력저하는 진행 중이다. 결단은 “검사 결과가 치료 시점을 정해주는 건 아니다.”라고 말하고, 추론은 확신과 성급함을 구분하며, 공감은 오판의 위험을 환자가 감당함을 지적한다.

- 검체 채취 확인 후 hemin 시작 → `TX_PREP_01`
- 탄수화물/지지치료 후 결과 대기 → `TX_GLUCOSE_WAIT` (+20분, delayed)
- 확진 결과까지 치료 보류 → `TX_WAIT_RESULT` (+30분, significant delay, critical)

## TX_PREP_01 / WAIT_002

PBG 검체가 이미 나간 것을 확인하고 hemin을 시작한다. 유발 가능 약물 중단, 충분한 탄수화물, 전해질 및 신경학적 반복 평가를 병행한다. `hemin_started`, `treatment_timing=appropriate`, `disease_progression_halted`를 기록하며 PBG는 pending이다. 증상은 기적처럼 즉시 사라지지 않지만 빠른 악화는 멈춘다.

## PBG_RESULT

```text
Urine PBG: markedly elevated
Urine ALA: elevated
```

이는 **급성 간성 포르피린증**의 생화학적 확인이다. 이때 AIP로 확정하지 않으며 아형은 후속 HMBS 결과를 기다린다. `pbg_positive`, `acute_hepatic_porphyria_confirmed`와 positive test 상태를 기록한다.

이미 hemin을 시작했으면 `DISCLOSE_001`, 아니면 `TX_001`로 간다. `TX_001`은 hemin 시작(`TX_HEMIN`), 탄수화물만 지속(`TX_GLUCOSE`), 추가 관찰(`TX_DELAY`)을 제공한다. 탄수화물만으로는 진행성 신경증상의 definitive treatment가 아니며, 무한 지연은 허용하지 않는다.

# ACT 5 — 설명, 회복, 윤리

- `DISCLOSE_001`: immersive 진단 설명. validation 선택은 trust +8과 `patient_validation_given`; 임상적 설명은 +2; 치료 우선 회피는 -3.
- `DISCLOSE_002`: “다행이다… 아픈데 다행이라는 말 이상하네요.”
- `TX_MONTAGE`: Day 1부터 Day 2–3까지 복통·자율신경·Na는 점진적으로 개선되고 운동약화는 천천히 회복한다. significant delay이면 `residual_weakness`와 보행 재활을 기록한다.
- `RECOVERY_001`: 숟가락을 한 손으로 드는 장면으로 초기 운동약화 motif를 회수한다.
- `EXPLAIN_001`: heme synthesis pathway와 저열량/저탄수화물 및 hormonal exposure를 촉발 요인으로 설명하되 환자를 탓하지 않는다.
- `EXPLAIN_002`: 이전 단서와 정상 검사에 대한 설명을 선택한다.
- `ETHICS_001`: family boundary 위반 여부로 `ETHICS_FAMILY` 또는 `ETHICS_RESPECTED`로 분기한다. 사과하면 +8 및 `patient_apology_given`; 정당화/회피하면 관계 악화가 남는다.
- `DISCHARGE_001`: 약물/호르몬 검토, 극단적 제한 회피, 재발 시 병력 알림, 유전상담·아형검사와 필요 시 재활을 안내한다. 긴 금기 목록 암기는 요구하지 않는다.

# ACT 6 — 아형 확정과 후속

## EP_001 — 17일 후

`HMBS pathogenic variant identified.` 이 시점에 처음으로 최종 아형을 **급성 간헐성 포르피린증(Acute Intermittent Porphyria)**으로 확정한다. `aip_confirmed=true`, `final_diagnosis=acute_intermittent_porphyria`를 기록한다.

## EP_002

trust ≥60이면 “오늘 물병 혼자 열었어요.”라는 회복 메시지, trust 30–59이면 외래 기록, trust <30 또는 미해결 boundary violation이면 다른 진료팀으로 후속 진료가 전환된다.

# ACT 7 — Ending resolver

`EndingContext`는 diagnosis, treatment, trigger, relationship 네 축만 사용한다. 우선순위는 아래와 같다.

1. diagnosis failed → `END_E` 정상 검사라는 함정
2. significant delay → `END_B` 늦게 도착한 정답
3. relationship broken → `END_C` 병은 찾고 사람은 잃다
4. trigger partial/unknown → `END_D` 절반의 진단
5. 그 외 → `END_A` 이름을 되찾다

Trigger sufficient는 severe caloric restriction과 recent hormonal medication을 모두 확인한 경우다. Relationship은 trust와 미해결 boundary violation을 함께 반영한다. UI에는 trust 숫자, score, rank, 정답률을 표시하지 않는다.

`FAIL_001`에서는 다른 팀이 뒤늦게 markedly elevated urine PBG와 HMBS pathogenic variant를 확인하며 `diagnosis_outcome=failed`가 된다. 이는 `END_E`를 실제 플레이로 도달 가능하게 한다.

# ACT 8 — Archive, Reflection, Completion

## CASE_ARCHIVE

보존 필드: case ID/title, final diagnosis, biochemical diagnosis, subtype confirmation, diagnosis/treatment/trigger/relationship outcome, 발견한 trigger, 합병증, 환자 경과, relationship/follow-up, ending ID. enum은 자연스러운 한국어로 렌더링하며 score/rank 필드는 없다.

## REFLECTION

관찰·문진·기전·공감·의심·결단 중 실제 능력치와 선택 조건에 부합하는 voice만 규칙 기반으로 노출한다. 마지막에 Case Memory `normal_is_not_diagnosis`(정상은 진단이 아니다)를 해제한다.

## CASE_COMPLETE

Case Archive 보기와 처음부터 다시 시작을 제공한다. 완료 시 `firstEndingCompleted=true`이며 profile의 `completedCases`, `caseMemories`, `archives`는 active run reset 뒤에도 보존된다. Case Memory는 ID로 중복 해제하지 않는다.

# 의학적 불변 조건

1. 증상 중 markedly elevated urine PBG/ALA는 acute hepatic porphyria의 생화학적 확인이다.
2. AIP는 HMBS pathogenic variant 뒤에만 확정한다.
3. 진행성 운동약화, Na 121, 신경정신 증상, 자율신경 불안정은 중증 급성 발작으로 취급한다.
4. hemin은 용량 암기가 아니라 치료 방향과 시점의 선택이다.
5. glucose/carbohydrate alone은 이 환자의 definitive treatment가 아니다.
6. 저나트륨혈증은 세부 속도 암기 없이 주의 깊은 교정과 모니터링으로 표현한다.

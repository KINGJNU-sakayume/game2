# 스토리 파이프라인

챕터는 데이터로 만든다. 엔진(`src/game/engine`)은 챕터 이름, 플래그, 인물을 모른다. 챕터 파일은 대본처럼 읽혀야 하고, 규칙은 `OutcomeRules`와 조건·효과로만 엔진에 전달된다.

```text
src/game/content/
  shared/helpers.ts      작성용 어휘 (p, d, me, s, stamp, note, thought, voice, memoryVoice, go, at …)
  shared/validation.ts   lintChapter · validateChapterGraph · validateVisualAssets
  shared/simulate.ts     simulateChapter (무작위 플레이) · routeTo (검수용 경로 찾기)
  index.ts               챕터 레지스트리 (순서 = 해금 순서)
  pipeline.test.ts       모든 챕터에 같은 검사를 돌린다
  chapter0N/
    caseData.ts          단서 · 감별진단 · 검사 정의
    helpers.ts           이 챕터 환자 ID와 신뢰 헬퍼
    opening.ts …         막(act)별 노드
    index.ts             ChapterDefinition · OutcomeRules · ArchiveDefinition · 비주얼 에셋
    chapter0N.test.ts    시나리오 테스트
```

## 1. 새 챕터 추가 순서

1. `chapter0N/` 폴더를 만들고 `caseData.ts`에 단서(clue), 감별진단(diagnosis), 검사(test)를 정의한다.
2. 막별 파일에 노드를 쓴다. 각 파일은 `Record<string, StoryNode>`를 내보낸다.
3. `index.ts`에서 `assembleNodeSources(...)`로 노드를 합치고 `ChapterDefinition`을 만든다.
   - `number`, `subtitle`, `synopsis`, `cover`(타이틀 화면 표지), `characters`(화자 목록), `outcomes`, `completion`(Case Memory · 사건 기록).
4. `content/index.ts`의 `chapters` 배열 끝에 추가한다. 배열 순서가 해금 순서다.
5. `npm test`를 돌린다. 파이프라인 테스트가 새 챕터를 자동으로 검사한다.
6. 시나리오 테스트(`chapter0N.test.ts`)로 이상적 경로와 엔딩 축마다 한 경로씩 고정한다.

## 2. 노드 작성

```ts
ER_001: {
  id: "ER_001",
  title: "응급실 11",
  presentation: {
    backdrop: "er-night", assetId: "SCN3_001_ER_NIGHT", timeLabel: "21:40", location: "응급실 11", titleStyle: "place",
    clinicalData: [{ label: "T", value: "39.2", tone: "warning" }, { label: "SpO2", value: "93%", tone: "warning" }],
  },
  onEnter: [{ type: "setTime", value: at(21, 40) }, clue("fever_6days")],
  blocks: [d("서지안", "“소변 백혈구 10에서 20. 세프트리악손 걸어두려고요.”"), thought("observation", "이불을 턱까지 올리고 있다.", 3)],
  choices: [ … ],
},
```

### 블록 (한 탭 = 한 비트)

| 헬퍼 | 화면 | 용도 |
| --- | --- | --- |
| `p(text)` | 서술 (명조) | 장면, 행동 |
| `d(speaker, text)` / `me(text)` | 대사 (고딕, 화자 색) | 인물의 말. `me`는 플레이어("나") |
| `s(text)` | 인쇄된 기록지 | 검사 수치, 모니터, 회신 |
| `stamp("03:10")` | 큰 시각 도장 | 시간 점프 |
| `note(text)` | 손글씨 메모 | 메시지, 처방 메모 |
| `thought(ability, text, 기준치?)` | 능력의 속마음 | 능력치가 기준 이상일 때만 들린다 |
| `voice(ability, text, 조건[])` | 능력의 속마음 | 임의 조건 |
| `memoryVoice(memoryId, text, 조건[])` | "기억" 라벨 | 앞 챕터를 끝낸 플레이어에게만 |

- 블록 텍스트 안의 `\n\n`은 같은 비트 안의 문단 구분이다. 대사는 짧게 끊는다. 한 비트는 모바일 3줄을 넘기지 않는 것이 목표다.
- 모든 블록은 `conditions`를 받을 수 있다. 조건이 거짓이면 그 비트는 없다.

### 선택지

- `go("NEXT", "라벨")` — 앞으로 가는 한 걸음. **버튼이 아니라 화면 탭**으로 진행된다. 라벨은 대화 상자 오른쪽 아래의 작은 힌트로만 보인다. "계속", "화면 탭" 같은 긴 가로 버튼을 만들지 않는다.
- 두 개 이상이면 선택 카드가 된다. `“…”`로 시작하는 라벨은 말하는 선택지(명조), 나머지는 행동 선택지(고딕)로 렌더링된다.
- 판정: `check: { id, ability, dc }`와 `next: { success, failure }`. 2d6 + 능력치 ≥ DC. 결과는 토스트로 짧게 보여주고 수치는 숨긴다.
- 셸 동작: `action: "restart" | "title" | "nextChapter"`는 게임 밖 화면 이동이다.

### 연출 (`presentation`)

| 필드 | 의미 |
| --- | --- |
| `mode` | `default` · `immersive`(암전, 중앙 텍스트) · `cinematic`(세로 사진 전체) · `conference`(증례 보드) |
| `assetId` / `backdrop` | 사진 슬롯과 CSS 무대. 둘 다 없으면 **이전 장면을 이어받는다**(보드·암전 장면은 건너뜀) |
| `location`, `timeLabel` | HUD의 장소·시각. `location`도 이어받는다 |
| `titleStyle` | `chapter` · `phase` · `ending` 카드(탭으로 닫힘), `place` 좌상단 장소 캡션, `heading` |
| `clinicalData` | HUD 바이탈 모니터. `tone: "warning" | "critical"` |
| `hotspots` | 드래그로 둘러보는 사진 위의 조사 지점 (`choiceId`와 연결) |
| `prompt` | 텍스트 없이 선택지만 있을 때 대화 상자에 뜨는 한 줄 |
| `autoAdvanceMs` + `autoNext` | 시간이 지나면 넘어가는 카드 |
| `screen` | `archive` · `reflection` · `complete` 종결 화면 |
| `hideTime`, `hideCase`, `hideVitals` | HUD 요소 숨김 |

백드롭 키: `black paper dawn board phone er er-night ward icu hallway home-night semibasement rain village field`.
**밝기 원칙**: 밤 장면이어도 병원은 형광등 아래다. 어두운 무대(`black`, `phone`, `home-night`, `rain`, `semibasement`)는 짧은 전환 장면에만 쓴다.

## 3. 결과 축과 엔딩

모든 챕터는 같은 다섯 엔딩 슬롯(END_A~E)과 같은 값 계약을 쓴다.

```text
diagnosis_outcome  "appropriate" | "late" | "failed"
treatment_timing   "appropriate" | "delayed"
ending_id          END_CALC에서 고른 엔딩
```

`OutcomeRules`가 챕터의 의미를 축에 연결한다.

| 축 | 계산 |
| --- | --- |
| 진단 | `diagnosis_outcome` 값 |
| 치료 시점 | `treatment_timing` 값, `severeDelayFlag` |
| 유발 요인 | `triggers[]` 플래그 중 몇 개를 찾았나 → unknown / partial / sufficient |
| 관계 | `patientId`의 신뢰도와 `brokenBelow`, `trustedAt`; `boundaryFlag`가 서 있고 `repairFlag`가 없으면 broken |

우선순위: failed → **E** / 지연 → **B** / 관계 broken → **C** / 유발 요인 불충분 → **D** / 나머지 → **A**.
`END_CALC` 노드는 같은 조건으로 선택지를 하나만 열어 둔다. 조건이 겹치거나 비면 시뮬레이션이 잡아낸다.

## 4. 챕터 사이의 연결

- **Case Memory**: `completion.memory`. 다음 런은 `memory_<id>` 플래그를 가진 채 시작한다. `memoryVoice`로 그 교훈이 들어맞는 순간에만 말하게 한다. 교훈을 설명하지 말고, 같은 상황을 다시 만나게 한다.
- **능력 성장**: 챕터를 끝내면 그 런에서 가장 많이 공명(resonance)한 능력 하나가 1 오른다(최대 5, 동률은 고정 순서). 공명은 판정에 처음 성공할 때와 `resonate` 효과로 쌓인다. 다음 챕터는 기본 능력(관찰 3, 나머지 2)으로도, 성장한 능력으로도 풀려야 한다.
- **해금**: 앞 챕터를 끝내야 다음 챕터가 열린다. 리뷰 빌드는 `?unlock=all`.

## 5. 비주얼 에셋

- 사진이 준비된 슬롯: `status` 없음 + `public/assets/chapter0N/ID.webp`(진짜 WebP여야 한다. 테스트가 헤더를 확인한다).
- 아직 없는 슬롯: `status: "missing"` + `fallback`(`assetId` 다른 사진, 또는 `backdrop` CSS 무대). 증거 사진이 없으면 `fallback.label`을 단 메모 카드로 보인다.
- 사진 속 글자에 단서를 맡기지 않는다. 정확한 값은 `overlay.fields/lines`로 HTML에 둔다.
- 촬영 기준과 샷 리스트는 `docs/VISUAL_BIBLE.md`.

## 6. 검증

`npm test`가 레지스트리의 모든 챕터에 대해 실행한다.

| 검사 | 잡아내는 것 |
| --- | --- |
| `lintChapter` | 없는 노드·단서·진단·검사·환자 참조, 화자 목록에 없는 화자, 중복 선택지 ID, 짝 없는 핫스팟, 막다른 노드, 시작점에서 닿지 않는 노드, 없는 에셋, 엔딩·결과 규칙 누락 |
| `validateChapterGraph` | 다섯 엔딩과 종결 노드 도달성, 자동 전환 순환 |
| `validateVisualAssets` | 에셋 ID·비율·경로, 없는 대체 에셋, 참조 전용 에셋 사용 |
| WebP 무결성 | 준비된 에셋이 실제 WebP인지, missing 에셋 파일이 남아 있지 않은지 |
| `simulateChapter` 600회 | 무작위 능력·무작위 선택으로 **모든 런이 종결**되고 **다섯 엔딩이 모두** 나오는지 |
| `simulateChapter` 1200회 | 한 번도 보이지 않는 노드가 없는지 |
| `routeTo` | 검수용 점프가 실제 플레이 경로로 엔딩까지 닿는지 |

엔딩 하나가 안 나오면 대부분 축 정의가 서로 겹치거나(예: 유발 요인 두 개가 같은 선택에 묶임) 앞 단계에서 모든 경로가 한쪽으로 쏠린 것이다. 시뮬레이션 분포를 보고 선택지 조건을 고친다.

## 7. 검수 도구

- 개발 서버(`npm run dev`)에서 `?chapter=chapter-03&node=ER_004` — 그 노드까지 **실제로 플레이해서** 들어간다(`routeTo`). 장면, 장소, 시각, 차트가 실제와 같다. 경로가 없으면 노드로 바로 들어간다. 프로덕션 빌드는 무시한다.
- `?unlock=all` — 모든 챕터 해금.
- 모바일 뷰포트(390×844)에서 스크린샷으로 확인한다: 대화 상자가 3줄 안에 들어오는지, 선택지가 화면을 넘지 않는지, 토스트가 장소 캡션·모니터와 겹치지 않는지.

## 8. 커밋 전 확인

```bash
npm run typecheck && npm run lint && npm test
npm run build && npm run validate:pwa
```

`next dev`가 `next-env.d.ts`를 고쳐 쓰면 lint가 실패한다. 커밋 전에 `git checkout next-env.d.ts`.

# Visual Bible

## Visual thesis

**Realistic contemporary Korean documentary photography, restrained clinical realism — bright, not noir.** Images provide atmosphere, spatial context, and observable evidence; story-critical text, drug and hospital names, laboratory results, and monitor values remain accessible HTML rather than pixels.

Do not use cyberpunk, glossy K-drama promotional style, fashion photography, horror, oversaturated teal/orange, anime, or exaggerated cinematic lighting. Do not crush blacks: the game must read on a phone in daylight. A night scene is a lit room with a dark window, not a dark frame.

## 윤하린 continuity (Chapter 1)

윤하린 is a 28-year-old Korean woman, approximately 165 cm, slim but not pathologically emaciated. She has a slightly long oval face, natural Korean skin tone, dark brown eyes, a jaw-to-shoulder dark brown straight bob, natural side-swept fringe, subtle under-eye fatigue, and minimal makeup. She is a working musical theatre ensemble actress—not a celebrity or model.

- Rehearsal: dark rehearsal top, black pants, sneakers.
- Hospital: the same pale Korean hospital patient clothing through every hospital image.
- No glasses. No tattoo emphasis. No jewelry emphasis.
- Hospital progression: hair becomes gradually messier, fatigue increases, posture weakens, then all improve during recovery.
- `CHR_HARIN_MASTER_01` is the identity/production reference. It must never appear in game UI.
- `SCN_001_ER_INITIAL`, `SCN_002_ER_WEAKNESS`, `SCN_005_ER_DETERIORATION`, `SCN_006_TREATMENT`, and `SCN_007_RECOVERY` share room and wardrobe continuity group `ER_07`.

## Camera language

Use a first-person doctor viewpoint for most images. Never show the player character's face and avoid unnecessary player-hand shots. Aim for smartphone/documentary camera realism around a 35 mm equivalent; no extreme wide angle. Preserve subtle film grain and realistic skin texture.

- Hospital: neutral/cool fluorescent light, never blue. Night shifts are still fully lit.
- Homes: warm practical lighting, lamps on.
- Rehearsal: realistic practical stage/rehearsal lighting.
- Countryside: flat autumn daylight, dry grass, no golden-hour glamour.

## Composition and delivery

Keep important text outside generated images. Evidence imagery establishes the object and context; the UI supplies exact records such as the weight notebook values. Do not make clues depend on OCR or visual text parsing.

The stage is portrait (phone). Scenes are cropped to the `focalPoint` and slowly zoomed, so keep the subject inside the central 60% and leave calm space at the bottom third, where the dialogue panel sits.

| Kind | Composition | Working master | Delivery target |
| --- | --- | --- | --- |
| CIN | 9:16, subject-safe vertical frame | about 1200×2133 | WebP, preferably around or below 500 KB |
| SCN | 16:9 environmental frame | about 1600×900 | WebP, preferably around or below 500 KB |
| EVD | 4:3 or 1:1 object/document frame | about 1200×900 or 1200×1200 | WebP, preferably around or below 500 KB |

Files live at `public/assets/chapter0N/<ID>.webp`. The pipeline test rejects a file that is not a real WebP (the header must be `RIFF….WEBP`) and rejects a file left behind for a slot still marked missing. To ship a photo: add the file, then remove `status: "missing"` (and the `fallback`) from its manifest entry.

## Slots still to shoot

Until a slot is shot, the game stages it with its declared fallback: another photo, a CSS backdrop (`src/app/globals.css`, `.backdrop--*`), or, for evidence, a taped field note that carries the same HTML data.

### Chapter 1 — 아무것도 없는 배

The committed files for the first three were an import error string, not images; they were removed.

| ID | Kind | Shot | Fallback now |
| --- | --- | --- | --- |
| `CIN_001_REHEARSAL` | CIN 9:16 | Night rehearsal room, ensemble repeating a phrase toward empty seats; 하린 mid-line, right hand drifting to her abdomen. Practical overheads, mirror wall. | `SCN_004_REHEARSAL_EMPTY` |
| `CIN_002_COLLAPSE` | CIN 9:16 | Low angle from the floor: 하린's knee buckling, a water bottle rolling away, 세영's sneakers stepping in. No face contortion, no drama lighting. | `EVD_005_WATER_BOTTLE` |
| `EVD_002_FRIDGE` | EVD 4:3 | Open studio fridge, almost empty: sparkling water, two low-fat yogurts, three eggs, bottled coffee in the door. Cold interior light only. | note card with the shelf list |
| `SCN_007_RECOVERY` | SCN 16:9 | Same ER_07 bay by morning; 하린 sitting up, opening a water bottle herself, hospital tray. Hair tidier, colour back. | `dawn` backdrop |

### Chapter 2 — 창문을 닫은 방

Late summer after a flood, Seoul semi-basement (반지하). Water line on the wallpaper at knee height everywhere in the home.

| ID | Kind | Shot | Fallback now |
| --- | --- | --- | --- |
| `SCN2_001_PEDS_ER` | SCN 16:9 | Morning paediatric ER bay: a nine-year-old boy lying curled, his mother on the stool pressing her temple. Bright, busy, ordinary. | `er` |
| `SCN2_002_SEMIBASEMENT` | SCN 16:9 | One-room semi-basement: high street-level window with ankles passing, blue tape sealing its frame, damp floor mats, water line on the wallpaper. Also the title-screen cover for chapter 2. | `semibasement` |
| `SCN2_003_CHAMBER` | SCN 16:9 | Monoplace hyperbaric chamber: clear acrylic tube, round porthole, control panel. Clinical daylight. | `icu` |
| `SCN2_004_WARD` | SCN 16:9 | Paediatric ward room in afternoon sun, two beds pushed close. | `ward` |
| `EVD2_001_FLUE` | EVD 4:3 | Boiler exhaust flue with the joint pulled apart and soot around the gap. | note card (joint · soot · 212 ppm) |
| `EVD2_002_TAPED_WINDOW` | EVD 4:3 | Semi-basement window sealed with two layers of blue tape. | note card |
| `EVD2_003_CAGE` | EVD 4:3 | Hamster cage on the floor one step from the boiler-room door; bedding, a wheel, no animal visible. Never show a dead animal. | note card |

### Chapter 3 — 아무도 보지 않은 곳

Early autumn, 전북 countryside and a Seoul hospital. 문순례, 76: small, sun-browned, short permed grey hair, work trousers; hospital gown after admission.

| ID | Kind | Shot | Fallback now |
| --- | --- | --- | --- |
| `SCN3_001_ER_NIGHT` | SCN 16:9 | ER bay at night under fluorescent light: an old woman with the blanket pulled up to her chin, her daughter beside her; one black window with the blinds half down. | `er-night` |
| `SCN3_002_ICU_BAY` | SCN 16:9 | ICU bay before dawn: high-flow oxygen running, an intubation kit laid open and waiting on the trolley. No patient face. | `icu` |
| `SCN3_003_WARD_MORNING` | SCN 16:9 | Infectious-disease ward in morning sun, a tray with rice porridge. | `ward` |
| `EVD3_001_ESCHAR` | EVD 4:3 | **Do not photograph a body.** A clinician's exam sketch: outline of the torso on a chart sheet, a small black dot under the left breast at the underwire line, "8 mm" measured beside it. | note card "진찰 기록" |
| `EVD3_002_GRAVE_PHOTO` | EVD 4:3 | Phone snapshot: two grandmothers sitting on freshly cut grass in front of a burial mound, short sleeves, bare hands, no mat, lunch boxes open. | note card "추석 사진" |
| `EVD3_003_DOG_PHOTO` | EVD 4:3 | Phone snapshot: a yellow village dog (누렁이), a tick visible inside its ear. | note card "추석 사진" |
| `EVD3_004_PADDY_PHOTO` | EVD 4:3 | Phone snapshot: a rice paddy the day after rain, water being let through a gap in the bund, bare ankles. | note card "추석 사진" |
| `EVD3_005_STORE_PHOTO` | EVD 4:3 | Phone snapshot: a farm storehouse, straw sacks, mouse droppings along the wall. | note card "추석 사진" |

Phone snapshots should look like a daughter's phone photos: slightly tilted, imperfect framing, no filters.

## QA before shipping each asset

Crop and focal point on a 390×844 portrait screen, alt text matches the image, compression under ~500 KB, character identity and room/wardrobe continuity, no legible text the HTML does not also carry, and the separate evidence data still reads correctly beside the photo.

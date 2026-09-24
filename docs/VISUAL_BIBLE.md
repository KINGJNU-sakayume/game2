# Chapter 1 Visual Bible

## Visual thesis

**Realistic contemporary Seoul documentary photography, restrained clinical noir.** Images provide atmosphere, spatial context, and observable evidence; story-critical text, drug and hospital names, laboratory results, and monitor values remain accessible HTML rather than pixels.

Do not use cyberpunk, glossy K-drama promotional style, fashion photography, horror, oversaturated teal/orange, anime, or exaggerated cinematic lighting.

## 윤하린 continuity

윤하린 is a 28-year-old Korean woman, approximately 165 cm, slim but not pathologically emaciated. She has a slightly long oval face, natural Korean skin tone, dark brown eyes, a jaw-to-shoulder dark brown straight bob, natural side-swept fringe, subtle under-eye fatigue, and minimal makeup. She is a working musical theatre ensemble actress—not a celebrity or model.

- Rehearsal: dark rehearsal top, black pants, sneakers.
- Hospital: the same pale Korean hospital patient clothing through every hospital image.
- No glasses. No tattoo emphasis. No jewelry emphasis.
- Hospital progression: hair becomes gradually messier, fatigue increases, posture weakens, then all improve during recovery.
- `CHR_HARIN_MASTER_01` is the identity/production reference. It must never appear in game UI.
- `SCN_001_ER_INITIAL`, `SCN_002_ER_WEAKNESS`, `SCN_005_ER_DETERIORATION`, `SCN_006_TREATMENT`, and `SCN_007_RECOVERY` share room and wardrobe continuity group `ER_07`.

## Camera language

Use a first-person doctor viewpoint for most images. Never show the player character's face and avoid unnecessary player-hand shots. Aim for smartphone/documentary camera realism around a 35 mm equivalent; no extreme wide angle. Preserve subtle film grain and realistic skin texture.

- Hospital: neutral/cool fluorescent light, never blue.
- Apartment: warm practical lighting.
- Rehearsal: realistic practical stage/rehearsal lighting.

## Composition and delivery

Keep important text outside generated images. Evidence imagery establishes the object and context; the UI supplies exact records such as the weight notebook values. Do not make clues depend on OCR or visual text parsing.

| Kind | Composition | Working master | Delivery target |
| --- | --- | --- | --- |
| CIN | 9:16, subject-safe vertical frame | about 1200×2133 | WebP, preferably around or below 500 KB |
| SCN | 16:9 environmental frame | about 1600×900 | WebP, preferably around or below 500 KB |
| EVD | 4:3 or 1:1 object/document frame | about 1200×900 or 1200×1200 | WebP, preferably around or below 500 KB |

AVIF can be evaluated later. Chapter 1 currently reserves paths under `public/assets/chapter01/`; image files are deliberately absent until identity and continuity QA is complete. Validate crop, focal point, alt text, compression, Harin identity, hospital room/wardrobe continuity, and legibility of the separate HTML evidence data before shipping each asset.

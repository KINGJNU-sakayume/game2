import { describe, expect, it } from "vitest";
import { chapter01 } from "@/game/content/chapter01";
import { enterNode } from "@/game/engine/nodeResolver";
import { createRun } from "@/game/engine/runFactory";
import { defaultPlayer } from "@/game/content";
import { paginate, spokenText, toBeat, toSteps, type Beat } from "./beats";
import { continueChoice, evidenceFor, locationFor, resolveAsset, sceneFor } from "./scene";

const prose = (text: string): Beat => ({ kind: "prose", text });
const line = (speaker: string, text: string): Beat => ({ kind: "dialogue", speaker, text });

describe("beat pagination", () => {
  it("builds short prose lines up on one page", () => {
    const pages = paginate(["박자.", "한 번.", "두 번."].map(prose));
    expect(pages).toHaveLength(1);
    expect(toSteps(pages)).toEqual([{ page: 0, count: 1 }, { page: 0, count: 2 }, { page: 0, count: 3 }]);
  });

  it("starts a new page when the speaker, kind or line budget changes", () => {
    const pages = paginate([line("강수진", "a"), line("강수진", "b"), line("윤하린", "c"), prose("d"), prose("1\n2\n3\n4\n5\n6")]);
    expect(pages.map((page) => [page.kind, page.beats.length])).toEqual([["dialogue", 2], ["dialogue", 1], ["prose", 1], ["prose", 1]]);
  });

  it("never merges system readouts", () => {
    const pages = paginate([toBeat({ type: "system", text: "Na 124" }), toBeat({ type: "system", text: "Na 121", variant: "stamp" })]);
    expect(pages).toHaveLength(2);
    expect(pages[0].beats[0]).toMatchObject({ kind: "system", variant: "readout" });
  });

  it("strips the quotation marks the speaker tag makes redundant", () => {
    expect(spokenText("“또 설명해야 돼요?”")).toBe("또 설명해야 돼요?");
    expect(spokenText("“그 말.” 하고 멈춘다")).toBe("“그 말.” 하고 멈춘다");
  });
});

describe("scene resolution", () => {
  const run = (...nodes: string[]) => nodes.reduce((state, id) => enterNode(state, chapter01, id, 2), createRun(chapter01, defaultPlayer, { seed: 1, timestamp: 1 }));

  it("stages a fallback photograph for assets that failed to import", () => {
    const art = resolveAsset(chapter01, "CIN_001_REHEARSAL");
    expect(art).toMatchObject({ type: "asset", asset: { id: "SCN_004_REHEARSAL_EMPTY" } });
    expect(resolveAsset(chapter01, "SCN_007_RECOVERY")).toEqual({ type: "backdrop", key: "dawn" });
    expect(resolveAsset(chapter01, "CHR_HARIN_MASTER_01")).toBeUndefined();
  });

  it("inherits the last scene and keeps evidence in front of it", () => {
    const state = run("APT_001", "APT_DESK");
    expect(sceneFor(chapter01, state)).toMatchObject({ type: "asset", asset: { id: "SCN_003_APARTMENT" } });
    expect(evidenceFor(chapter01, chapter01.nodes.APT_DESK)?.id).toBe("EVD_003_WEIGHT_NOTEBOOK");
    expect(locationFor(chapter01, state)).toBe("윤하린의 원룸");
  });

  it("treats one plain forward choice as tap-to-continue, never a check or an action", () => {
    expect(continueChoice(chapter01.nodes.PR_002.choices!)?.id).toBe("continue-PR_003");
    expect(continueChoice(chapter01.nodes.ER_PAIN_02.choices!)).toBeUndefined();
    expect(continueChoice(chapter01.nodes.ER_001.choices!)).toBeUndefined();
  });
});

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapters, defaultPlayer, getChapter, getNextChapter, isChapterUnlocked, nextUnplayedChapter } from "@/game/content";
import { lintChapter, validateChapterGraph, validateVisualAssets } from "@/game/content/shared/validation";
import { routeTo, simulateChapter } from "@/game/content/shared/simulate";
import { emptyProfile } from "@/game/state/saveStore";

/**
 * Every chapter passes through the same pipeline checks. A new chapter only
 * needs to be added to the registry to be covered here.
 */
describe.each(chapters.map((chapter) => [chapter.id, chapter] as const))("story pipeline: %s", (_id, chapter) => {
  it("lints clean: references, speakers, hotspots, dead ends, reachability", () => {
    expect(lintChapter(chapter)).toEqual([]);
  });

  it("has a valid graph with every ending and the completion node reachable", () => {
    expect(validateChapterGraph(chapter, ["END_A", "END_B", "END_C", "END_D", "END_E", chapter.completion?.nodeId ?? "CASE_COMPLETE"])).toEqual([]);
  });

  it("has a consistent visual asset manifest", () => {
    expect(validateVisualAssets(chapter)).toEqual([]);
  });

  it("ships every ready asset as a real WebP file and never ships a missing one", () => {
    for (const asset of Object.values(chapter.visualAssets ?? {})) {
      const path = `${process.cwd()}/public/${asset.src}`;
      if (asset.status === "missing" || asset.referenceOnly) {
        expect(existsSync(path), `${asset.id} is marked missing but a file exists`).toBe(false);
        continue;
      }
      const header = readFileSync(path).subarray(0, 12);
      expect(header.subarray(0, 4).toString("latin1"), asset.id).toBe("RIFF");
      expect(header.subarray(8, 12).toString("latin1"), asset.id).toBe("WEBP");
    }
  });

  it("always reaches case completion under random play and reaches all five endings", () => {
    const report = simulateChapter(chapter, { runs: 600 });
    expect(report.failures).toEqual([]);
    expect(report.completed).toBe(report.runs);
    expect(Object.keys(report.endings).sort()).toEqual(["END_A", "END_B", "END_C", "END_D", "END_E"]);
  });

  it("leaves no authored node unseen across random play", () => {
    const report = simulateChapter(chapter, { runs: 1200, seed: 7 });
    expect(Object.keys(chapter.nodes).filter((id) => !report.visited.has(id))).toEqual([]);
  });

  it("routes a review jump to any ending through real play", () => {
    for (const ending of ["END_A", "END_E", chapter.completion?.nodeId ?? "CASE_COMPLETE"]) {
      const state = routeTo(chapter, defaultPlayer, ending);
      expect(state?.currentNodeId, ending).toBe(ending);
      expect(state?.visitedNodeIds.length, ending).toBeGreaterThan(10);
    }
  });
});

describe("chapter registry", () => {
  it("orders chapters and unlocks them one case at a time", () => {
    expect(chapters.map((chapter) => chapter.number)).toEqual(chapters.map((_, index) => index + 1));
    const profile = emptyProfile();
    expect(isChapterUnlocked(chapters[0], profile)).toBe(true);
    if (chapters[1]) {
      expect(isChapterUnlocked(chapters[1], profile)).toBe(false);
      expect(isChapterUnlocked(chapters[1], profile, true)).toBe(true);
      const completed = { ...profile, completedCases: [chapters[0].completion!.caseId] };
      expect(isChapterUnlocked(chapters[1], completed)).toBe(true);
      expect(nextUnplayedChapter(completed)).toBe(chapters[1]);
      expect(getNextChapter(chapters[0].id)).toBe(chapters[1]);
    }
    expect(nextUnplayedChapter(profile)).toBe(chapters[0]);
    expect(getChapter("nope")).toBeUndefined();
  });

  it("keeps chapter, case and memory IDs unique", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(chapters.map((chapter) => chapter.id))).toBe(true);
    expect(unique(chapters.map((chapter) => chapter.completion!.caseId))).toBe(true);
    expect(unique(chapters.map((chapter) => chapter.completion!.memory.id))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { chapter01 } from "./index";
import { CHAPTER01_GAME_ASSET_IDS, chapter01VisualAssets } from "./visualAssets";
import { assembleNodeSources, validateVisualAssets } from "./graphValidator";
import { getNextVisualAssets, MAX_VISUAL_PRELOADS } from "@/game/presentation/preloadVisualAssets";
import type { StoryNode } from "@/game/types";

const mapping: Record<string, string> = {
  PR_002: "CIN_001_REHEARSAL", PR_004: "CIN_002_COLLAPSE", ER_001: "SCN_001_ER_INITIAL",
  ER_007: "SCN_002_ER_WEAKNESS", URINE_001: "EVD_001_URINE", APT_001: "SCN_003_APARTMENT",
  APT_FRIDGE: "EVD_002_FRIDGE", APT_DESK: "EVD_003_WEIGHT_NOTEBOOK", APT_VANITY: "EVD_004_OCP",
  REH_001: "SCN_004_REHEARSAL_EMPTY", REH_MOTOR: "EVD_005_WATER_BOTTLE",
  DET_003: "SCN_005_ER_DETERIORATION", TX_PREP_01: "SCN_006_TREATMENT", RECOVERY_001: "SCN_007_RECOVERY",
};

describe("Chapter 1 visual asset manifest", () => {
  it("contains all 14 canonical game assets and a reference-only master", () => {
    expect(CHAPTER01_GAME_ASSET_IDS).toHaveLength(14);
    expect(CHAPTER01_GAME_ASSET_IDS.every(id => chapter01VisualAssets[id] && !chapter01VisualAssets[id].referenceOnly)).toBe(true);
    expect(chapter01VisualAssets.CHR_HARIN_MASTER_01.referenceOnly).toBe(true);
    expect(validateVisualAssets(chapter01, CHAPTER01_GAME_ASSET_IDS)).toEqual([]);
  });

  it.each(Object.entries(mapping))("maps %s to %s", (nodeId, assetId) => {
    expect(chapter01.nodes[nodeId].presentation?.assetId).toBe(assetId);
  });

  it("has no prototype keys or reference assets in game nodes", () => {
    const presentations = Object.values(chapter01.nodes).map(node => node.presentation ?? {});
    expect(presentations.every(presentation => !("imageKey" in presentation))).toBe(true);
    expect(presentations.every(({ assetId }) => assetId !== "rehearsal" && assetId !== "erInitial")).toBe(true);
    expect(JSON.stringify(presentations)).not.toContain("CHR_HARIN_MASTER_01");
  });

  it("records the five hospital images in one continuity group", () => {
    const ids = ["SCN_001_ER_INITIAL", "SCN_002_ER_WEAKNESS", "SCN_005_ER_DETERIORATION", "SCN_006_TREATMENT", "SCN_007_RECOVERY"];
    expect(ids.map(id => chapter01VisualAssets[id].continuityGroup)).toEqual(Array(5).fill("ER_07"));
  });

  it("keeps exact notebook values in structured HTML data rather than narrative image text", () => {
    expect(chapter01VisualAssets.EVD_003_WEIGHT_NOTEBOOK.overlay?.fields?.map(({ value }) => value)).toEqual(["51.2", "50.4", "49.8", "49.1"]);
    expect(JSON.stringify(chapter01.nodes.APT_DESK.blocks)).not.toContain("51.2");
  });

  it("limits next-node preloads and ignores destinations without assets", () => {
    const node: StoryNode = { id: "source", blocks: [], choices: Object.keys(mapping).slice(0, 5).map((next, i) => ({ id: String(i), label: next, next })) };
    expect(getNextVisualAssets(chapter01, node)).toHaveLength(MAX_VISUAL_PRELOADS);
  });

  it("rejects duplicate node IDs instead of silently overwriting FIELD_GATE", () => {
    const node: StoryNode = { id: "FIELD_GATE", blocks: [] };
    expect(() => assembleNodeSources({ FIELD_GATE: node }, { FIELD_GATE: node })).toThrow(/Duplicate node ID/);
    expect(Object.values(chapter01.nodes).filter(({ id }) => id === "FIELD_GATE")).toHaveLength(1);
  });
});

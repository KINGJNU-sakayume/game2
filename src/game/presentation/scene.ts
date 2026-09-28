import type { BackdropKey, ChapterDefinition, Choice, GameState, SceneHotspot, StoryNode, VisualAssetDefinition } from "@/game/types";

export type SceneArt =
  | { type: "asset"; asset: VisualAssetDefinition; focalPoint?: { x: number; y: number } }
  | { type: "backdrop"; key: BackdropKey };

export const artKey = (art: SceneArt) => art.type === "asset" ? `asset:${art.asset.id}` : `backdrop:${art.key}`;

/**
 * Resolves an asset ID to what the stage can actually show. Missing assets use
 * their declared fallback so a failed import never leaves a blank screen.
 */
export function resolveAsset(chapter: ChapterDefinition, assetId: string | undefined): SceneArt | undefined {
  const asset = assetId ? chapter.visualAssets?.[assetId] : undefined;
  if (!asset || asset.referenceOnly) return undefined;
  if (asset.status !== "missing") return { type: "asset", asset, focalPoint: asset.focalPoint };
  const fallback = asset.fallback?.assetId ? chapter.visualAssets?.[asset.fallback.assetId] : undefined;
  if (fallback && fallback.status !== "missing") return { type: "asset", asset: fallback, focalPoint: asset.fallback?.focalPoint ?? fallback.focalPoint };
  if (asset.fallback?.backdrop) return { type: "backdrop", key: asset.fallback.backdrop };
  return undefined;
}

const nodeScene = (chapter: ChapterDefinition, node: StoryNode | undefined): SceneArt | undefined => {
  const presentation = node?.presentation;
  if (!presentation) return undefined;
  const declared = presentation.assetId ? chapter.visualAssets?.[presentation.assetId] : undefined;
  if (declared && declared.kind !== "evidence") {
    const resolved = resolveAsset(chapter, presentation.assetId);
    if (resolved) return resolved;
  }
  return presentation.backdrop ? { type: "backdrop", key: presentation.backdrop } : undefined;
};

/**
 * The place the player is standing in. Nodes without art inherit the latest
 * scene from the run history, so this also survives a reload.
 */
export function sceneFor(chapter: ChapterDefinition, run: GameState, fallback: BackdropKey = "paper"): SceneArt {
  for (let index = run.visitedNodeIds.length - 1; index >= 0; index--) {
    const scene = nodeScene(chapter, chapter.nodes[run.visitedNodeIds[index]]);
    if (scene) return scene;
  }
  return nodeScene(chapter, chapter.nodes[run.currentNodeId]) ?? { type: "backdrop", key: fallback };
}

/** The latest named location in the run history (nodes rarely repeat it). */
export function locationFor(chapter: ChapterDefinition, run: GameState): string | undefined {
  for (let index = run.visitedNodeIds.length - 1; index >= 0; index--) {
    const location = chapter.nodes[run.visitedNodeIds[index]]?.presentation?.location;
    if (location) return location;
  }
  return chapter.nodes[run.currentNodeId]?.presentation?.location;
}

/** The evidence object being examined on this node, if any. */
export function evidenceFor(chapter: ChapterDefinition, node: StoryNode): VisualAssetDefinition | undefined {
  const asset = node.presentation?.assetId ? chapter.visualAssets?.[node.presentation.assetId] : undefined;
  return asset?.kind === "evidence" ? asset : undefined;
}

export function getVisibleHotspots(hotspots: SceneHotspot[] = [], choiceIds: Set<string>) {
  return hotspots.filter((hotspot) => choiceIds.has(hotspot.choiceId));
}

/** A single ordinary step forward. It is taken by tapping the stage, not by a button. */
export function continueChoice(choices: readonly Choice[]): Choice | undefined {
  if (choices.length !== 1) return undefined;
  const [choice] = choices;
  if (choice.check || ("action" in choice && choice.action) || ("terminal" in choice && choice.terminal)) return undefined;
  return choice;
}

export const isDefaultContinueLabel = (label: string) => label === "계속";

import type { ChapterDefinition, StoryNode, VisualAssetDefinition } from "@/game/types";
import { resolveAssetUrl } from "./assetUrl";
import { resolveAsset } from "./scene";

export const MAX_VISUAL_PRELOADS = 2;

function destinations(node: StoryNode): string[] {
  const result = node.autoNext ? [node.autoNext] : [];
  for (const choice of node.choices ?? []) {
    if (!("next" in choice) || !choice.next) continue;
    if (typeof choice.next === "string") result.push(choice.next);
    else result.push(choice.next.success, choice.next.failure);
  }
  return result;
}

export function getNextVisualAssets(chapter: ChapterDefinition, node: StoryNode, limit = MAX_VISUAL_PRELOADS): VisualAssetDefinition[] {
  const seen = new Set<string>();
  return destinations(node).flatMap(id => {
    // Missing assets resolve to their fallback, so a broken import is never requested.
    const art = resolveAsset(chapter, chapter.nodes[id]?.presentation?.assetId);
    const asset = art?.type === "asset" ? art.asset : undefined;
    if (!asset || seen.has(asset.id)) return [];
    seen.add(asset.id); return [asset];
  }).slice(0, Math.min(limit, MAX_VISUAL_PRELOADS));
}

export function preloadVisualAssets(assets: readonly VisualAssetDefinition[]): void {
  if (typeof window === "undefined") return;
  for (const asset of assets.slice(0, MAX_VISUAL_PRELOADS)) {
    const image = new Image(); image.src = resolveAssetUrl(asset.src);
  }
}

import type { ChapterDefinition } from "@/game/types";
import { validateVisualAssets as validateAssets } from "../shared/validation";

export { assembleNodeSources, lintChapter, reachableNodeIds, validateChapterGraph } from "../shared/validation";

/** Chapter 1 keeps its identity master as a production-only reference. */
export function validateVisualAssets(chapter: ChapterDefinition, requiredGameIds: readonly string[] = []): string[] {
  return validateAssets(chapter, requiredGameIds, ["CHR_HARIN_MASTER_01"]);
}

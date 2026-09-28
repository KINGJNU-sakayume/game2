import type { ChapterDefinition, PersistentProfile } from "@/game/types";
import { chapter01, defaultPlayer } from "./chapter01";

/** Every playable chapter, in story order. */
export const chapters: readonly ChapterDefinition[] = [chapter01];

export { defaultPlayer };

export const getChapter = (id: string): ChapterDefinition | undefined => chapters.find((chapter) => chapter.id === id);

export function getNextChapter(id: string): ChapterDefinition | undefined {
  const index = chapters.findIndex((chapter) => chapter.id === id);
  return index >= 0 ? chapters[index + 1] : undefined;
}

const completionId = (chapter: ChapterDefinition) => chapter.completion?.caseId ?? chapter.id;
export const isChapterCompleted = (chapter: ChapterDefinition, profile: PersistentProfile) => profile.completedCases.includes(completionId(chapter));

/** A chapter opens once the previous one has been closed at least once. */
export function isChapterUnlocked(chapter: ChapterDefinition, profile: PersistentProfile, unlockAll = false): boolean {
  if (unlockAll) return true;
  const index = chapters.indexOf(chapter);
  if (index <= 0) return index === 0;
  return isChapterCompleted(chapters[index - 1], profile);
}

/** The chapter a “새 사건” button should start: the first one not yet completed. */
export function nextUnplayedChapter(profile: PersistentProfile, unlockAll = false): ChapterDefinition {
  return chapters.find((chapter) => isChapterUnlocked(chapter, profile, unlockAll) && !isChapterCompleted(chapter, profile)) ?? chapters[0];
}

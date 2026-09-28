"use client";
import { useEffect, useState } from "react";
import { defaultPlayer, getChapter } from "@/game/content";
import { enterNode } from "@/game/engine/nodeResolver";
import { createRun } from "@/game/engine/runFactory";
import { useGameStore } from "@/game/state/gameStore";
import { useSettings } from "@/game/state/settingsStore";
import { Stage } from "@/components/stage/Stage";
import { TitleScreen } from "./TitleScreen";

/** `?unlock=all` opens every chapter for review builds. */
function useUnlockAll() {
  const [unlockAll, setUnlockAll] = useState(false);
  useEffect(() => { setUnlockAll(new URLSearchParams(window.location.search).get("unlock") === "all"); }, []);
  return unlockAll;
}

/**
 * Development only: `?chapter=chapter-01&node=APT_001` opens a scene directly
 * for layout review. Production builds ignore it.
 */
function useDevSceneJump(hydrated: boolean) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const nodeId = params.get("node");
    const chapter = getChapter(params.get("chapter") ?? "chapter-01");
    if (!nodeId || !chapter?.nodes[nodeId]) return;
    const run = enterNode(createRun(chapter, defaultPlayer, { seed: 7 }), chapter, nodeId, Date.now());
    useGameStore.setState({ activeRun: run, screen: "play" });
  }, [hydrated]);
}

export function GameApp() {
  const { hydrated, activeRun, screen, profile, hydrate, startChapter, resume } = useGameStore();
  const loadSettings = useSettings((state) => state.load);
  const unlockAll = useUnlockAll();
  useEffect(() => { void hydrate(); loadSettings(); }, [hydrate, loadSettings]);
  useDevSceneJump(hydrated);

  // A save from a chapter that no longer exists is ignored rather than crashing.
  const chapter = activeRun ? getChapter(activeRun.chapterId) : undefined;
  const run = chapter && activeRun && chapter.nodes[activeRun.currentNodeId] ? activeRun : null;

  if (!hydrated) return <main className="loading" aria-live="polite"><span className="loading-mark" aria-hidden="true" />기록을 불러오는 중</main>;
  if (screen === "play" && run && chapter) return <Stage chapter={chapter} run={run} defaultPlayer={defaultPlayer} />;
  return (
    <TitleScreen
      profile={profile}
      activeRun={run}
      activeChapter={run ? chapter : undefined}
      unlockAll={unlockAll}
      onContinue={resume}
      onStart={(next) => void startChapter(next, profile.player ?? defaultPlayer)}
    />
  );
}

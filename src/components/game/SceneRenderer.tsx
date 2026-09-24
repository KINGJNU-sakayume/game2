"use client";

import { useEffect } from "react";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { getAvailableChoices } from "@/game/engine/nodeResolver";
import { useGameStore } from "@/game/state/gameStore";
import type { ChapterDefinition, PlayerState } from "@/game/types";
import { ChoiceList } from "./ChoiceList";
import { NarrativeBlock } from "./NarrativeBlock";

export function SceneRenderer({ chapter, player }: { chapter: ChapterDefinition; player: PlayerState }) {
  const { activeRun, hydrated, inputLocked, hydrate, initialize, choose, enter } = useGameStore();
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { if (hydrated && !activeRun) initialize(chapter, player); }, [activeRun, chapter, hydrated, initialize, player]);
  const node = activeRun ? chapter.nodes[activeRun.currentNodeId] : undefined;
  const autoAdvanceMs = node?.presentation?.autoAdvanceMs;
  const autoNext = node?.autoNext;
  useEffect(() => {
    if (!autoNext || autoAdvanceMs === undefined) return;
    const timer = window.setTimeout(() => enter(chapter, autoNext), autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceMs, autoNext, chapter, enter]);
  if (!hydrated || !activeRun) return <main className="grid min-h-dvh place-items-center text-stone-400" aria-live="polite">기록을 불러오는 중…</main>;
  if (!node) return <main className="p-8 text-red-200">장면을 찾을 수 없습니다.</main>;
  const choices = getAvailableChoices(node, activeRun);
  const blocks = node.blocks.filter((block) => evaluateConditions(block.conditions, activeRun));
  const presentation = node.presentation;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-10">
      {presentation?.mode !== "immersive" && <header className="mb-12 flex items-center justify-between border-b border-white/10 pb-4">
        {!presentation?.hideCase && <span className="text-xs font-medium tracking-[.22em] text-amber-200/70">{chapter.title}</span>}
        <div className="flex gap-4 text-xs text-stone-500" aria-label="현재 상태">{!presentation?.hideTime && <span>{presentation?.timeLabel ?? `경과 ${activeRun.time}분`}</span>}{presentation?.location && <span>{presentation.location}</span>}</div>
      </header>}
      <article className="flex-1" aria-labelledby="scene-title">
        {presentation?.imageKey && <div className={`scene-image scene-image-${presentation.imageKey}`} role="img" aria-label={presentation.imageKey === "rehearsal" ? "빈 객석을 향한 무대 리허설" : "응급실 07의 진료 공간"} />}
        {node.title && <h1 id="scene-title" className="mb-8 font-serif text-3xl font-medium tracking-tight text-stone-50">{node.title}</h1>}
        {blocks.map((block, index) => <NarrativeBlock block={block} key={index} />)}
        <ChoiceList choices={choices} disabled={inputLocked} onChoose={(id) => void choose(chapter, id)} />
      </article>
      <footer className="mt-16 text-center text-[11px] tracking-widest text-stone-600">AFTER THE RAIN</footer>
    </main>
  );
}

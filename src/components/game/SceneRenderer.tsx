"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { getAvailableChoices } from "@/game/engine/nodeResolver";
import { useGameStore } from "@/game/state/gameStore";
import type { ChapterDefinition, PlayerState } from "@/game/types";
import { formatGameTime } from "@/game/abilities";
import { createArchive } from "@/game/engine/endingResolver";
import { CaseButton } from "@/components/case/CaseButton"; import { CaseSheet } from "@/components/case/CaseSheet";
import { selectReflectionBlocks } from "@/game/presentation/selectReflectionBlocks";
import { ChoiceList } from "./ChoiceList"; import { NarrativeFeed } from "./NarrativeFeed"; import { GameShell } from "./GameShell"; import { SceneHeader } from "./SceneHeader"; import { SceneMedia } from "./SceneMedia"; import { ClinicalStrip } from "./ClinicalStrip"; import { CaseArchiveView } from "./CaseArchiveView";
import { EvidenceView } from "@/components/field/EvidenceView";
import { getNextVisualAssets, preloadVisualAssets } from "@/game/presentation/preloadVisualAssets";

export function getVisibleHotspots(hotspots: NonNullable<NonNullable<ChapterDefinition["nodes"][string]["presentation"]>["hotspots"]> = [], choiceIds: Set<string>) {
  return hotspots.filter(hotspot => choiceIds.has(hotspot.choiceId));
}

export function SceneRenderer({ chapter, player }: { chapter: ChapterDefinition; player: PlayerState }) {
  const store=useGameStore(); const { activeRun,hydrated,inputLocked,hydrate,initialize,choose,enter,restart }=store; const [caseOpen,setCaseOpen]=useState(false); const articleRef=useRef<HTMLElement>(null);
  const openCase=useCallback(()=>setCaseOpen(true),[]); const closeCase=useCallback(()=>setCaseOpen(false),[]);
  useEffect(()=>{void hydrate();},[hydrate]); useEffect(()=>{if(hydrated&&!activeRun)initialize(chapter,player);},[activeRun,chapter,hydrated,initialize,player]);
  const node=activeRun?chapter.nodes[activeRun.currentNodeId]:undefined; const autoAdvanceMs=node?.presentation?.autoAdvanceMs; const autoNext=node?.autoNext;
  useEffect(()=>{if(!autoNext||autoAdvanceMs===undefined||caseOpen)return;const timer=window.setTimeout(()=>enter(chapter,autoNext),autoAdvanceMs);return()=>window.clearTimeout(timer);},[autoAdvanceMs,autoNext,caseOpen,chapter,enter]);
  useEffect(()=>{articleRef.current?.scrollIntoView({block:"start"});},[activeRun?.currentNodeId]);
  useEffect(()=>{if(node)preloadVisualAssets(getNextVisualAssets(chapter,node));},[chapter,node]);
  if(!hydrated||!activeRun)return <main className="loading-screen" aria-live="polite">기록을 불러오는 중…</main>; if(!node)return <main>장면을 찾을 수 없습니다.</main>;
  const visibleBlocks=node.blocks.filter(block=>evaluateConditions(block.conditions,activeRun)); const blocks=node.id==="REFLECTION"?selectReflectionBlocks(visibleBlocks,activeRun):visibleBlocks; const presentation=node.presentation; const immersive=presentation?.mode==="immersive"; const showCase=!immersive&&!presentation?.hideCase;
  const asset=presentation?.assetId?chapter.visualAssets?.[presentation.assetId]:undefined;
  const availableChoices=getAvailableChoices(node,activeRun); const availableChoiceIds=new Set(availableChoices.map(choice=>choice.id));
  const visibleHotspots=getVisibleHotspots(presentation?.hotspots,availableChoiceIds);
  const handleChoice=(id:string)=>id==="restart"?void restart(chapter,player):void choose(chapter,id);
  return <GameShell immersive={immersive} hasCase={showCase}>
    {!immersive&&<SceneHeader time={presentation?.hideTime?undefined:presentation?.timeLabel??formatGameTime(activeRun.time)} location={presentation?.location}/>}<SceneMedia asset={asset} hotspots={visibleHotspots} disabled={inputLocked} onHotspot={handleChoice}/>
    <article ref={articleRef} className="scene-content" aria-labelledby={node.title?"scene-title":undefined}>{asset?.kind==="evidence"&&<EvidenceView asset={asset}/>} {node.title&&<h1 id="scene-title">{node.title}</h1>}<ClinicalStrip data={presentation?.hideVitals?undefined:presentation?.clinicalData}/><NarrativeFeed blocks={blocks}/>{node.id==="CASE_ARCHIVE"&&chapter.completion&&<CaseArchiveView archive={createArchive(activeRun,chapter.completion.archive)}/>}<ChoiceList choices={availableChoices} disabled={inputLocked} onChoose={handleChoice}/></article>
    <footer>AFTER THE RAIN</footer>{showCase&&<CaseButton onClick={openCase}/>}<CaseSheet open={caseOpen} onClose={closeCase} chapter={chapter} state={activeRun} onPrimary={store.setPrimaryDiagnosis} onMove={store.moveDiagnosis} onLink={store.toggleLinkedClue}/>
  </GameShell>;
}

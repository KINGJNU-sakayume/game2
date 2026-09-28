"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CaseSheet } from "@/components/case/CaseSheet";
import { EvidenceView } from "@/components/field/EvidenceView";
import { ABILITY_PRESENTATION, formatGameTime } from "@/game/abilities";
import { createCaseArchive } from "@/game/engine/endingResolver";
import { getAvailableChoices } from "@/game/engine/nodeResolver";
import { getNextChapter } from "@/game/content";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";
import type { Beat } from "@/game/presentation/beats";
import { evidenceFor, getVisibleHotspots, locationFor, sceneFor } from "@/game/presentation/scene";
import { getNextVisualAssets, preloadVisualAssets } from "@/game/presentation/preloadVisualAssets";
import { useGameStore } from "@/game/state/gameStore";
import { TEXT_SPEED_CPS, useSettings } from "@/game/state/settingsStore";
import type { ChapterDefinition, Choice, GameState, PlayerState } from "@/game/types";
import { BacklogSheet, type LogEntry } from "./BacklogSheet";
import { CaseArchiveView } from "./CaseArchiveView";
import { CompletionView } from "./CompletionView";
import { Hud } from "./Hud";
import { MenuSheet } from "./MenuSheet";
import { NodeView } from "./NodeView";
import { Backdrop, SceneArt } from "./SceneArt";
import { PLACE_CARD_MS } from "./SceneCard";
import { Toasts, type Toast } from "./Toasts";
import { IconNext } from "./icons";

const LOG_LIMIT = 400;
const TOAST_MS = 2600;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

const clueSet = (run: GameState) => new Set(Object.values(run.patients).flatMap((patient) => patient.clues));

/**
 * The playing screen: full-bleed scene art, a HUD, the reading panel and the
 * chart. Everything story-specific comes from the chapter data.
 */
export function Stage({ chapter, run, defaultPlayer }: { chapter: ChapterDefinition; run: GameState; defaultPlayer: PlayerState }) {
  const store = useGameStore();
  const { inputLocked, persistenceStatus, profile, lastGrowth } = store;
  const { textSpeed, autoAdvance } = useSettings();
  const reducedMotion = usePrefersReducedMotion();
  const node = chapter.nodes[run.currentNodeId];

  const [caseOpen, setCaseOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seenClues, setSeenClues] = useState(() => clueSet(run).size);
  const firstPageBySpeaker = useRef(new Map<string, string>());
  const logId = useRef(0);

  const paused = caseOpen || logOpen || menuOpen;
  const cps = reducedMotion ? Infinity : TEXT_SPEED_CPS[textSpeed];

  const pushLog = useCallback((entry: Beat | { kind: "choice"; text: string }) => {
    setLog((current) => [...current, { ...entry, id: ++logId.current } as LogEntry].slice(-LOG_LIMIT));
  }, []);
  /** A speaker's role is captioned on the first page they speak in this session. */
  const showRole = useCallback((speaker: string, pageKey: string) => {
    const first = firstPageBySpeaker.current.get(speaker);
    if (first === undefined) { firstPageBySpeaker.current.set(speaker, pageKey); return true; }
    return first === pageKey;
  }, []);
  const onBeat = useCallback((beat: Beat) => pushLog(beat), [pushLog]);

  // Chart feedback: new clues and resolved tests become quiet toasts.
  const previous = useRef(run);
  useEffect(() => {
    const before = previous.current;
    previous.current = run;
    if (before === run || before.runId !== run.runId) return;
    const found: Toast[] = [];
    const known = clueSet(before);
    for (const id of clueSet(run)) {
      if (known.has(id)) continue;
      const clue = chapter.clueDefinitions?.[id];
      if (clue) found.push({ id: `clue-${id}-${run.updatedAt}`, kind: "clue", title: "단서", detail: clue.title });
    }
    for (const patient of Object.values(run.patients)) {
      for (const [testId, status] of Object.entries(patient.tests)) {
        if (before.patients[patient.id]?.tests[testId] === status) continue;
        const test = chapter.testDefinitions?.[testId];
        if (!test) continue;
        if (status === "positive" || status === "negative") found.push({ id: `test-${testId}-${status}`, kind: "test", title: "검사 결과", detail: `${test.nameKo} · ${status === "positive" ? "양성" : "음성"}` });
        else if (status === "pending") found.push({ id: `test-${testId}-pending`, kind: "test", title: "검사 의뢰", detail: test.nameKo });
      }
    }
    if (!found.length) return;
    // A place title owns the top of the screen first; the chart notes follow as it fades.
    const entered = chapter.nodes[run.currentNodeId];
    const delay = before.currentNodeId !== run.currentNodeId && entered?.title && entered.presentation?.titleStyle === "place" ? PLACE_CARD_MS - 500 : 0;
    const ids = new Set(found.map((toast) => toast.id));
    window.setTimeout(() => {
      setToasts((current) => [...current, ...found].slice(-3));
      window.setTimeout(() => setToasts((current) => current.filter((toast) => !ids.has(toast.id))), TOAST_MS);
    }, delay);
  }, [run, chapter]);

  useEffect(() => { if (node) preloadVisualAssets(getNextVisualAssets(chapter, node)); }, [chapter, node]);
  useEffect(() => { if (caseOpen) setSeenClues(clueSet(run).size); }, [caseOpen, run]);

  const handleChoice = useCallback((choice: Choice) => {
    pushLog({ kind: "choice", text: choice.label });
    if ("action" in choice && choice.action) {
      if (choice.action === "title") store.goToTitle();
      else if (choice.action === "restart") void store.restart(chapter, run.player);
      else if (choice.action === "nextChapter") {
        const next = getNextChapter(chapter.id);
        if (next) void store.startChapter(next, profile.player ?? defaultPlayer);
      }
      return;
    }
    void store.choose(chapter, choice.id).then(() => {
      if (!choice.check) return;
      const result = useGameStore.getState().activeRun?.checkResults[choice.check.id];
      if (!result) return;
      const ability = ABILITY_PRESENTATION[result.ability];
      const toast: Toast = { id: `check-${choice.check.id}`, kind: "check", ability: result.ability, title: `${ability.symbol} ${ability.name}`, detail: result.success ? "통했다" : "닿지 않았다" };
      setToasts((current) => [...current.filter((item) => item.id !== toast.id), toast].slice(-3));
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), TOAST_MS);
    });
  }, [chapter, run.player, store, profile.player, defaultPlayer, pushLog]);

  const onTimedAdvance = useCallback(() => { void store.advance(chapter); }, [store, chapter]);

  const art = useMemo(() => sceneFor(chapter, run), [chapter, run]);
  if (!node) return <main className="stage stage--missing"><p>장면을 찾을 수 없다.</p></main>;

  const presentation = node.presentation ?? {};
  const mode = presentation.mode ?? "default";
  const immersive = mode === "immersive";
  const evidence = evidenceFor(chapter, node);
  const availableHotspots = getVisibleHotspots(presentation.hotspots, new Set(getAvailableChoices(node, run).map((choice) => choice.id)));
  const visitKey = `${node.id}:${run.visitedNodeIds.length}`;
  const time = presentation.hideTime ? undefined : presentation.timeLabel ?? formatGameTime(run.time);
  const location = locationFor(chapter, run);
  const newClues = Math.max(0, clueSet(run).size - seenClues);
  const nextChapter = getNextChapter(chapter.id);
  const ambient = art.type === "asset" ? resolveAssetUrl(art.asset.src) : undefined;

  const renderExtra = ({ atEnd, choices }: { atEnd: boolean; choices: Choice[] }) => {
    if (presentation.screen === "archive" && chapter.completion) {
      const forward = choices[0];
      return (
        <div className="paper-screen" onClick={(event) => event.stopPropagation()}>
          <CaseArchiveView archive={createCaseArchive(run, chapter)} definition={chapter.completion.archive} />
          {forward && <button type="button" className="button-primary paper-next" disabled={inputLocked} onClick={() => handleChoice(forward)}>{forward.label}<IconNext width={18} height={18} /></button>}
        </div>
      );
    }
    if (presentation.screen === "complete") {
      const usable = choices.filter((choice) => !("action" in choice && choice.action === "nextChapter") || nextChapter);
      const archive = chapter.completion ? profile.archives.find((item) => item.caseId === chapter.completion!.archive.caseId) : undefined;
      return (
        <div className="paper-screen is-centered">
          <CompletionView
            caseId={chapter.completion?.archive.caseId}
            memory={chapter.completion?.memory}
            archive={archive}
            growth={lastGrowth?.chapterId === chapter.id ? lastGrowth.ability : undefined}
            choices={usable.map((choice) => "action" in choice && choice.action === "nextChapter" && nextChapter ? { ...choice, label: `다음 사건 — ${nextChapter.subtitle ?? nextChapter.title}` } : choice)}
            disabled={inputLocked}
            onChoose={(id) => { const choice = usable.find((item) => item.id === id); if (choice) handleChoice(choice); }}
          />
        </div>
      );
    }
    if (evidence) return <div className={`evidence-layer ${atEnd ? "is-settled" : ""}`}><EvidenceView asset={evidence} /></div>;
    return null;
  };

  return (
    <main className={`stage stage--${mode}`} data-screen={presentation.screen}>
      {ambient && <div className="stage-ambient" style={{ "--ambient": `url("${ambient}")` } as CSSProperties} aria-hidden="true" />}
      <div className="stage-frame">
        {!immersive && <SceneArt art={art} hotspots={availableHotspots} disabled={inputLocked} onHotspot={(choiceId) => { const choice = node.choices?.find((item) => item.id === choiceId); if (choice) handleChoice(choice); }} dim={Boolean(evidence)} />}
        {immersive && <div className="immersive-bg"><Backdrop backdrop={presentation.backdrop ?? "black"} /></div>}
        <NodeView
          key={visitKey}
          chapter={chapter}
          run={run}
          node={node}
          cps={cps}
          autoAdvance={autoAdvance}
          disabled={inputLocked}
          paused={paused}
          onChoose={handleChoice}
          onTimedAdvance={onTimedAdvance}
          onBeat={onBeat}
          showRole={showRole}
          placeMeta={[presentation.timeLabel, presentation.location !== node.title ? presentation.location : undefined].filter(Boolean).join(" · ") || undefined}
          renderExtra={renderExtra}
          customChoices={presentation.screen === "archive" || presentation.screen === "complete"}
          hotspotScene={art.type === "asset" && availableHotspots.length > 0}
        />
        <Hud
          minimal={immersive || Boolean(presentation.screen)}
          time={time}
          location={location}
          chapterLabel={undefined}
          vitals={presentation.hideVitals ? undefined : presentation.clinicalData}
          showCase={!immersive && !presentation.hideCase}
          newClues={newClues}
          onCase={() => setCaseOpen(true)}
          onLog={() => setLogOpen(true)}
          onMenu={() => setMenuOpen(true)}
        />
        <Toasts toasts={toasts} lowered={!immersive && !presentation.screen && !presentation.hideVitals && Boolean(presentation.clinicalData?.length)} />
      </div>
      <CaseSheet open={caseOpen} onClose={() => setCaseOpen(false)} chapter={chapter} state={run} onPrimary={store.setPrimaryDiagnosis} onMove={store.moveDiagnosis} onLink={store.toggleLinkedClue} />
      <BacklogSheet open={logOpen} onClose={() => setLogOpen(false)} entries={log} characters={chapter.characters} />
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onTitle={store.goToTitle}
        onRestart={() => void store.restart(chapter, run.player)}
        chapterLabel={chapter.number ? `CHAPTER ${chapter.number}` : undefined}
        chapterTitle={chapter.subtitle ?? chapter.title}
        degraded={persistenceStatus === "degraded"}
      />
    </main>
  );
}

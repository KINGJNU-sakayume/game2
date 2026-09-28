"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { evaluateConditions } from "@/game/engine/conditionResolver";
import { getAvailableChoices } from "@/game/engine/nodeResolver";
import { DEFAULT_LIMITS, IMMERSIVE_LIMITS, paginate, spokenText, toBeat, toSteps, type Beat } from "@/game/presentation/beats";
import { continueChoice, isDefaultContinueLabel } from "@/game/presentation/scene";
import { selectReflectionBlocks } from "@/game/presentation/selectReflectionBlocks";
import type { ChapterDefinition, Choice, GameState, StoryNode } from "@/game/types";
import { ChoiceList } from "./ChoiceList";
import { ConferenceBoard } from "./ConferenceBoard";
import { DialogueBox, PageBody } from "./DialogueBox";
import { PlaceCard, SceneCard } from "./SceneCard";
import { useTypewriter } from "./useTypewriter";

type BlockingCard = "chapter" | "phase" | "ending";
const isBlocking = (style?: string): style is BlockingCard => style === "chapter" || style === "phase" || style === "ending";
const AUTO_BASE_MS = 900;
const AUTO_PER_CHAR_MS = 38;
const CARD_MS: Record<BlockingCard, number> = { chapter: 2400, phase: 2200, ending: 2800 };

export interface NodeViewProps {
  chapter: ChapterDefinition;
  run: GameState;
  node: StoryNode;
  cps: number;
  autoAdvance: boolean;
  disabled: boolean;
  /** True while a sheet or modal owns the keyboard. */
  paused: boolean;
  onChoose: (choice: Choice) => void;
  onTimedAdvance: () => void;
  onBeat: (beat: Beat) => void;
  showRole: (speaker: string, pageKey: string) => boolean;
  placeMeta?: string;
  /** Extra layers the stage supplies for this node (evidence, archive, completion). */
  renderExtra?: (state: { atEnd: boolean; choices: Choice[] }) => ReactNode;
  /** Screens that render their own choices (archive / completion). */
  customChoices?: boolean;
  /** The photograph can be dragged, so the stage itself does not take taps. */
  hotspotScene?: boolean;
}

/**
 * One visit to one node. The stage remounts this component on every node entry
 * (keyed by visit), so reading position and typing always start fresh.
 */
export function NodeView({ chapter, run, node, cps, autoAdvance, disabled, paused, onChoose, onTimedAdvance, onBeat, showRole, placeMeta, renderExtra, customChoices = false, hotspotScene = false }: NodeViewProps) {
  const presentation = node.presentation ?? {};
  const mode = presentation.mode ?? "default";
  // A node visit reads the run as it was on entry; later state changes belong to the next visit.
  const [entryRun] = useState(run);
  const beats = useMemo(() => {
    const visible = node.blocks.filter((block) => evaluateConditions(block.conditions, entryRun));
    return (presentation.screen === "reflection" ? selectReflectionBlocks(visible, entryRun) : visible).map(toBeat);
  }, [node, entryRun, presentation.screen]);
  const pages = useMemo(() => paginate(beats, mode === "immersive" ? IMMERSIVE_LIMITS : DEFAULT_LIMITS), [beats, mode]);
  const steps = useMemo(() => toSteps(pages), [pages]);
  const choices = useMemo(() => getAvailableChoices(node, run), [node, run]);
  const forward = customChoices ? undefined : continueChoice(choices);

  const cardStyle = node.title && isBlocking(presentation.titleStyle) ? presentation.titleStyle : undefined;
  const [cardOpen, setCardOpen] = useState(Boolean(cardStyle));
  const [placeVisible, setPlaceVisible] = useState(presentation.titleStyle === "place" && Boolean(node.title));
  const [step, setStep] = useState(0);
  const timed = Boolean(node.autoNext && presentation.autoAdvanceMs !== undefined);

  const current = steps[step];
  const page = current ? pages[current.page] : undefined;
  const beat = page && current ? page.beats[current.count - 1] : undefined;
  const typingText = beat ? (beat.kind === "dialogue" ? spokenText(beat.text) : beat.text) : "";
  const instantBeat = beat?.kind === "system" && beat.variant === "stamp";
  const typewriter = useTypewriter(typingText, instantBeat ? Infinity : cps, !cardOpen);
  const reading = !cardOpen && steps.length > 0;
  const atEnd = !cardOpen && (steps.length === 0 || (step === steps.length - 1 && typewriter.done));

  // Backlog: each revealed beat is logged once.
  const logged = useRef(new Set<number>());
  useEffect(() => {
    if (!reading || !beat || logged.current.has(step)) return;
    logged.current.add(step);
    onBeat(beat);
  }, [reading, beat, step, onBeat]);

  useEffect(() => {
    if (!placeVisible) return;
    const timer = window.setTimeout(() => setPlaceVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [placeVisible]);

  const choose = useCallback((choice: Choice) => { if (!disabled) onChoose(choice); }, [disabled, onChoose]);

  const advance = useCallback(() => {
    if (cardOpen) {
      setCardOpen(false);
      if (timed && !steps.length) onTimedAdvance();
      return;
    }
    if (!typewriter.done) { typewriter.finish(); return; }
    if (step < steps.length - 1) { setStep(step + 1); return; }
    if (forward) choose(forward);
  }, [cardOpen, timed, steps.length, onTimedAdvance, typewriter, step, forward, choose]);
  // Timers call the latest advance without restarting on every render.
  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; });
  const advanceLatest = useCallback(() => advanceRef.current(), []);

  // Nodes with nothing to read and a single way on are passed straight through.
  const passThrough = Boolean(!cardOpen && steps.length === 0 && forward && !timed && !presentation.prompt && !node.title);
  useEffect(() => { if (passThrough && forward) choose(forward); }, [passThrough, forward, choose]);

  // Timed nodes without a blocking card still leave on schedule.
  useEffect(() => {
    if (!timed || cardStyle || paused) return;
    const timer = window.setTimeout(onTimedAdvance, presentation.autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [timed, cardStyle, paused, onTimedAdvance, presentation.autoAdvanceMs]);

  // Auto reading: pause in proportion to the line, then read on. Never through a real choice.
  const autoReady = autoAdvance && !paused && !cardOpen && typewriter.done && !disabled && steps.length > 0 && (step < steps.length - 1 || Boolean(forward));
  useEffect(() => {
    if (!autoReady) return;
    const timer = window.setTimeout(advanceLatest, AUTO_BASE_MS + typingText.length * AUTO_PER_CHAR_MS);
    return () => window.clearTimeout(timer);
  }, [autoReady, step, typingText.length, advanceLatest]);

  // Keyboard: Space / Enter / → to read on, number keys to choose.
  const showChoices = atEnd && !forward && !customChoices && choices.length > 0;
  useEffect(() => {
    if (paused) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      const onControl = Boolean(target?.closest("button, a, input, textarea, select"));
      if ((event.key === " " || event.key === "Enter") && onControl) return;
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") { event.preventDefault(); advanceLatest(); return; }
      if (showChoices && /^[1-9]$/.test(event.key)) {
        const choice = choices[Number(event.key) - 1];
        if (choice) { event.preventDefault(); choose(choice); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, advanceLatest, showChoices, choices, choose]);

  const view = { page, count: current?.count ?? 0, typed: typewriter.shown, typing: !typewriter.done };
  const visitId = useId();
  const pageKey = `${visitId}:${current?.page ?? 0}`;
  const roleFor = useCallback((speaker: string) => showRole(speaker, pageKey), [showRole, pageKey]);
  const hintLabel = forward && !isDefaultContinueLabel(forward.label) ? forward.label : undefined;
  const hint = atEnd ? (forward ? { label: hintLabel } : undefined) : reading ? {} : undefined;
  const heading = node.title && (!presentation.titleStyle || presentation.titleStyle === "heading") ? node.title : undefined;
  const prompt = steps.length === 0 ? presentation.prompt ?? heading : undefined;

  // Conference: findings are pinned to the board; the box carries the voices.
  const boardGroups = mode === "conference" && !cardOpen && current
    ? pages.flatMap((item, index) => {
      if (item.kind !== "system" || index > current.page) return [];
      const shown = index === current.page ? item.beats.slice(0, current.count) : item.beats;
      return [shown.flatMap((entry) => entry.text.split("\n"))];
    })
    : [];
  const boxHidden = mode === "conference" && page?.kind === "system";
  const ownsScreen = presentation.screen === "archive" || presentation.screen === "complete";

  return (
    <div className={`node node--${mode}`} data-node={node.id}>
      {mode === "conference" && <ConferenceBoard groups={boardGroups} />}
      {!ownsScreen && !hotspotScene && (
        <button type="button" className="tap-layer" onClick={advance} aria-label={atEnd && !forward ? "선택지를 고르세요" : "다음"} tabIndex={-1} />
      )}
      {renderExtra?.({ atEnd, choices })}
      {placeVisible && node.title && <PlaceCard title={node.title} meta={placeMeta} />}

      {!ownsScreen && (
        <div className="reading">
          {showChoices && (
            <ChoiceList
              choices={choices}
              disabled={disabled}
              heading={steps.length ? heading : undefined}
              compact={hotspotScene && choices.every((choice) => !choice.check && choice.label.length <= 16)}
              onChoose={(id) => { const choice = choices.find((item) => item.id === id); if (choice) choose(choice); }}
            />
          )}
          {mode === "immersive" ? (
            <div className="immersive-text" onClick={advance}>
              {page ? <PageBody view={view} characters={chapter.characters} showRole={roleFor} /> : prompt && <p className="prompt">{prompt}</p>}
              {hint && !view.typing && <span className="advance" aria-hidden="true">{hint.label}</span>}
              <p className="sr-only" aria-live="polite">{page ? page.beats.slice(0, view.count).map((item) => item.text).join("\n") : prompt}</p>
            </div>
          ) : !boxHidden && (page || prompt) ? (
            <DialogueBox view={view} characters={chapter.characters} showRole={roleFor} prompt={prompt} hint={hint} onAdvance={advance} compact={mode === "cinematic"} />
          ) : null}
        </div>
      )}

      {cardOpen && cardStyle && node.title && (
        <SceneCard
          style={cardStyle}
          title={node.title}
          caption={presentation.titleCaption}
          duration={cardStyle === "chapter" ? presentation.autoAdvanceMs ?? CARD_MS.chapter : CARD_MS[cardStyle]}
          onDone={advanceLatest}
        />
      )}
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";
import type { TitleStyle } from "@/game/types";

/**
 * Full-screen title moments: the chapter card, phase interstitials (증례 토의,
 * 현장 조사) and ending cards. Tap anywhere to move on; they also leave on their own.
 */
export function SceneCard({ style, title, caption, onDone, duration }: {
  style: Extract<TitleStyle, "chapter" | "phase" | "ending">;
  title: string;
  caption?: string;
  onDone: () => void;
  duration?: number;
}) {
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    if (!duration) return;
    const timer = window.setTimeout(() => done.current(), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);
  const lines = title.split("\n").filter(Boolean);
  return (
    <button type="button" className={`scene-card scene-card--${style}`} onClick={(event) => { event.stopPropagation(); onDone(); }} aria-label={`${caption ? `${caption} ` : ""}${title}. 탭하여 계속`}>
      <span className="scene-card-inner">
        {caption && <span className="scene-card-caption">{caption}</span>}
        <span className="scene-card-rule" aria-hidden="true" />
        <span className="scene-card-title">{lines.map((line) => <span key={line}>{line}</span>)}</span>
      </span>
    </button>
  );
}

/** A lower-third caption for arriving somewhere. It never blocks input. */
/** How long a place title holds the top of the screen. */
export const PLACE_CARD_MS = 2800;

export function PlaceCard({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="place-card" role="status">
      <span className="place-card-rule" aria-hidden="true" />
      <strong>{title}</strong>
      {meta && <span>{meta}</span>}
    </div>
  );
}

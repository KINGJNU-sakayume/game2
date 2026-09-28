"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reveals `text` at `cps` characters per second. `finish()` completes the line
 * immediately (the first tap during typing). Infinite speed renders instantly.
 */
export function useTypewriter(text: string, cps: number, enabled = true) {
  const glyphs = Array.from(text);
  const total = glyphs.length;
  const instant = !enabled || !Number.isFinite(cps) || cps <= 0;
  const [state, setState] = useState({ text, count: instant ? total : 0 });
  const frame = useRef<number | undefined>(undefined);

  // A new line restarts the reveal (derived state, reset during render).
  if (state.text !== text) setState({ text, count: instant ? total : 0 });
  const count = state.text === text ? (instant ? total : state.count) : (instant ? total : 0);

  useEffect(() => {
    if (instant || count >= total) return;
    const start = performance.now() - (count / cps) * 1000;
    const tick = (now: number) => {
      const next = Math.min(total, Math.floor(((now - start) / 1000) * cps));
      setState((current) => current.text === text && next > current.count ? { text, count: next } : current);
      if (next < total) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); };
    // count is intentionally read once per line: the loop owns progress after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, cps, instant, total]);

  const finish = useCallback(() => setState({ text, count: total }), [text, total]);
  return { shown: glyphs.slice(0, count).join(""), done: count >= total, finish };
}

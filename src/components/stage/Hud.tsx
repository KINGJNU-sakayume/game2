"use client";
import type { ClinicalDatum } from "@/game/types";
import { IconChart, IconLog, IconMenu } from "./icons";

function Monitor({ data }: { data: ClinicalDatum[] }) {
  const critical = data.some((datum) => datum.tone === "critical");
  return (
    <dl className={`monitor ${critical ? "is-critical" : ""}`} aria-label="활력징후">
      <svg className="monitor-trace" viewBox="0 0 120 24" aria-hidden="true" preserveAspectRatio="none">
        <path d="M0 14h26l4-6 4 12 5-18 5 22 4-10h22l4-4 4 4h42" />
      </svg>
      {data.map((datum) => (
        <div key={datum.label} data-tone={datum.tone ?? "default"}><dt>{datum.label}</dt><dd>{datum.value}</dd></div>
      ))}
    </dl>
  );
}

/**
 * Device-style overlay: where and when on the left, tools on the right. Kept
 * on dark glass so it reads over both bright wards and night scenes.
 */
export function Hud({ time, location, chapterLabel, vitals, showCase, newClues, onCase, onLog, onMenu, minimal }: {
  time?: string;
  location?: string;
  chapterLabel?: string;
  vitals?: ClinicalDatum[];
  showCase: boolean;
  newClues: number;
  onCase: () => void;
  onLog: () => void;
  onMenu: () => void;
  minimal?: boolean;
}) {
  const place = [location, time].filter(Boolean);
  return (
    <header className={`hud ${minimal ? "is-minimal" : ""}`}>
      <div className="hud-left">
        {!minimal && (place.length > 0 || chapterLabel) && (
          <p className="hud-place">
            {chapterLabel && <span className="hud-chapter">{chapterLabel}</span>}
            {location && <span>{location}</span>}
            {time && <time>{time}</time>}
          </p>
        )}
        {!minimal && vitals && vitals.length > 0 && <Monitor data={vitals} />}
      </div>
      <nav className="hud-tools" aria-label="게임 메뉴">
        {!minimal && <button type="button" className="hud-button" onClick={onLog} aria-label="지난 대사"><IconLog /></button>}
        {showCase && (
          <button type="button" className="hud-button hud-case" onClick={onCase} aria-haspopup="dialog" aria-label={newClues ? `환자 기록 열기, 새 단서 ${newClues}건` : "환자 기록 열기"}>
            <IconChart />
            {newClues > 0 && <span className="hud-badge" aria-hidden="true">{newClues > 9 ? "9+" : newClues}</span>}
          </button>
        )}
        <button type="button" className="hud-button" onClick={onMenu} aria-haspopup="dialog" aria-label="메뉴"><IconMenu /></button>
      </nav>
    </header>
  );
}

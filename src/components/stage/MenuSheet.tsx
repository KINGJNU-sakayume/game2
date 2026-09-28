"use client";
import { useState } from "react";
import { TEXT_SPEED_LABEL, useSettings, type TextSpeed } from "@/game/state/settingsStore";
import { Sheet } from "./Sheet";

const speeds: TextSpeed[] = ["slow", "normal", "fast", "instant"];

export function MenuSheet({ open, onClose, onTitle, onRestart, chapterLabel, chapterTitle, degraded }: {
  open: boolean;
  onClose: () => void;
  onTitle: () => void;
  onRestart: () => void;
  chapterLabel?: string;
  chapterTitle?: string;
  degraded: boolean;
}) {
  const { textSpeed, autoAdvance, update } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const close = () => { setConfirming(false); onClose(); };
  return (
    <Sheet open={open} onClose={close} title={chapterTitle ?? "메뉴"} kicker={chapterLabel} closeLabel="메뉴 닫기">
      <div className="menu">
        <fieldset className="menu-row">
          <legend>글자 속도</legend>
          <div className="segmented">
            {speeds.map((speed) => (
              <button key={speed} type="button" aria-pressed={textSpeed === speed} onClick={() => update({ textSpeed: speed })}>{TEXT_SPEED_LABEL[speed]}</button>
            ))}
          </div>
        </fieldset>
        <div className="menu-row menu-switch">
          <span id="auto-label">자동 넘김<small>선택지에서는 멈춘다</small></span>
          <button type="button" role="switch" aria-checked={autoAdvance} aria-labelledby="auto-label" className="switch" onClick={() => update({ autoAdvance: !autoAdvance })}><span /></button>
        </div>
        {degraded && <p className="menu-warning">이 기기에 진행 상황이 저장되지 않고 있다. 창을 닫으면 여기까지의 기록이 사라질 수 있다.</p>}
        <div className="menu-actions">
          <button type="button" className="button-quiet" onClick={() => { close(); onTitle(); }}>타이틀로</button>
          {!confirming ? (
            <button type="button" className="button-quiet is-danger" onClick={() => setConfirming(true)}>이 사건을 처음부터</button>
          ) : (
            <div className="confirm">
              <p>지금까지의 진행이 지워진다. 사건 기록과 Case Memory는 남는다.</p>
              <div>
                <button type="button" className="button-quiet" onClick={() => setConfirming(false)}>그만두기</button>
                <button type="button" className="button-primary is-danger" onClick={() => { close(); onRestart(); }}>처음부터</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

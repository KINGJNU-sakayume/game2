"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VisualAssetDefinition } from "@/game/types";
import { AssetImage } from "@/components/stage/AssetImage";

function EvidenceData({ asset }: { asset: VisualAssetDefinition }) {
  if (!asset.overlay) return null;
  return (
    <div className="evidence-data" aria-label="증거 기록">
      {asset.overlay.lines?.map((line) => <p key={line}>{line}</p>)}
      {asset.overlay.fields && <dl>{asset.overlay.fields.map((field, index) => <div key={`${field.label}-${index}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}
    </div>
  );
}

/**
 * An object under examination, shown as a pinned photograph. Exact values
 * (weights, labels) stay in HTML beside the photo, never only in the pixels.
 * A missing photograph degrades to a written field note.
 */
export function EvidenceView({ asset }: { asset: VisualAssetDefinition }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeModal = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const background = [...document.body.children].filter((element) => !element.classList.contains("evidence-modal"));
    background.forEach((element) => element.setAttribute("inert", ""));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".evidence-dialog");
      const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')] : [];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("evidence-open");
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("evidence-open");
      background.forEach((element) => element.removeAttribute("inert"));
      trigger?.focus();
    };
  }, [open]);

  const missing = asset.status === "missing";
  return (
    <section className={`evidence ${missing ? "is-note" : ""}`} aria-label="증거" onClick={(event) => event.stopPropagation()}>
      {missing ? (
        <div className="evidence-note">
          <span className="evidence-tag">{asset.fallback?.label ?? "현장 메모"}</span>
          <p className="evidence-caption">{asset.alt}</p>
          <EvidenceData asset={asset} />
        </div>
      ) : (
        <>
          <button ref={triggerRef} type="button" className="evidence-photo" onClick={() => setOpen(true)} aria-label={`${asset.alt} 확대`}>
            <span className="evidence-tag">증거</span>
            <AssetImage asset={asset} eager />
            <span className="evidence-zoom" aria-hidden="true">탭하여 확대</span>
          </button>
          <EvidenceData asset={asset} />
        </>
      )}
      {open && createPortal(
        <div className="evidence-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="evidence-dialog">
            <header>
              <h2 id={titleId}>증거 확대</h2>
              <button ref={closeRef} type="button" onClick={closeModal} aria-label="확대 이미지 닫기">닫기</button>
            </header>
            <AssetImage asset={asset} eager />
            <p>{asset.alt}</p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

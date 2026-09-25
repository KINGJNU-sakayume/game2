"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { VisualAssetDefinition } from "@/game/types";
import { AssetImage } from "@/components/game/SceneMedia";

export function EvidenceView({ asset }: { asset: VisualAssetDefinition }) {
  const [open, setOpen] = useState(false); const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const closeModal = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const background = [...document.body.children].filter(element => !element.classList.contains("evidence-modal"));
    background.forEach(element => element.setAttribute("inert", ""));
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
    document.addEventListener("keydown", onKeyDown); document.body.classList.add("evidence-open"); closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown); document.body.classList.remove("evidence-open");
      background.forEach(element => element.removeAttribute("inert")); trigger?.focus();
    };
  }, [open]);
  return <section className="evidence-view" aria-label="증거 이미지">
    <button ref={triggerRef} type="button" className="evidence-expand" onClick={()=>setOpen(true)} aria-label={`${asset.alt} 확대`}><AssetImage asset={asset}/><span>탭하여 확대</span></button>
    {asset.overlay && <div className="evidence-data" aria-label="증거 기록">
      {asset.overlay.lines?.map(line=><p key={line}>{line}</p>)}
      {asset.overlay.fields && <dl>{asset.overlay.fields.map((field,index)=><div key={`${field.label}-${index}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}
    </div>}
    {open && createPortal(<div className="evidence-modal" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)closeModal();}}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="evidence-dialog">
        <header><h2 id={titleId}>증거 확대</h2><button ref={closeRef} type="button" onClick={closeModal} aria-label="확대 이미지 닫기">닫기</button></header>
        <AssetImage asset={asset}/>
      </div>
    </div>, document.body)}
  </section>;
}

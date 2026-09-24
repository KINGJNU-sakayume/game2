"use client";
import { useEffect, useId, useState } from "react";
import type { VisualAssetDefinition } from "@/game/types";
import { AssetImage } from "@/components/game/SceneMedia";

export function EvidenceView({ asset }: { asset: VisualAssetDefinition }) {
  const [open, setOpen] = useState(false); const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close); document.body.classList.add("evidence-open");
    return () => { document.removeEventListener("keydown", close); document.body.classList.remove("evidence-open"); };
  }, [open]);
  return <section className="evidence-view" aria-label="증거 이미지">
    <button type="button" className="evidence-expand" onClick={()=>setOpen(true)} aria-label={`${asset.alt} 확대`}><AssetImage asset={asset}/><span>탭하여 확대</span></button>
    {asset.overlay && <div className="evidence-data" aria-label="증거 기록">
      {asset.overlay.lines?.map(line=><p key={line}>{line}</p>)}
      {asset.overlay.fields && <dl>{asset.overlay.fields.map((field,index)=><div key={`${field.label}-${index}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}
    </div>}
    {open && <div className="evidence-modal" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="evidence-dialog">
        <header><h2 id={titleId}>증거 확대</h2><button type="button" onClick={()=>setOpen(false)} aria-label="확대 이미지 닫기">닫기</button></header>
        <AssetImage asset={asset}/>
      </div>
    </div>}
  </section>;
}

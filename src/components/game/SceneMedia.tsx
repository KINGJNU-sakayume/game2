"use client";
import { useState, type ReactNode } from "react";
import type { SceneHotspot, VisualAssetDefinition } from "@/game/types";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";
import { SceneHotspots } from "@/components/field/SceneHotspots";

export type AssetLoadState = "loading" | "loaded" | "error";

export function AssetImage({ asset, className = "", children }: { asset: VisualAssetDefinition; className?: string; children?: ReactNode }) {
  const [state, setState] = useState<AssetLoadState>("loading");
  const position = asset.focalPoint ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%` : "50% 50%";
  return <div className={`asset-image ${className}`} data-load-state={state} style={{ aspectRatio: asset.aspectRatio.replace(":", " / ") }}>
    {state !== "loaded" && <div className="asset-fallback" role="img" aria-label={`${asset.alt} (${state === "error" ? "대체 이미지" : "이미지 준비 중"})`}/>}
    <img src={resolveAssetUrl(asset.src)} alt={state === "error" ? "" : asset.alt} aria-hidden={state === "error" || undefined} loading="lazy" decoding="async" style={{ objectPosition: position }} onLoad={()=>setState("loaded")} onError={()=>setState("error")}/>
    {children}
  </div>;
}

export function SceneMedia({ asset, hotspots = [], disabled = false, onHotspot }: { asset?: VisualAssetDefinition; hotspots?: SceneHotspot[]; disabled?: boolean; onHotspot?: (choiceId: string) => void }) {
  if (!asset || asset.kind === "evidence" || asset.referenceOnly) return null;
  return <AssetImage key={asset.id} asset={asset} className={`scene-media scene-media-${asset.kind}`}>
    {onHotspot && <SceneHotspots hotspots={hotspots} disabled={disabled} onHotspot={onHotspot}/>}
  </AssetImage>;
}

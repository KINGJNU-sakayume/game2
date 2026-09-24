"use client";
import { useState } from "react";
import type { VisualAssetDefinition } from "@/game/types";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";

export type AssetLoadState = "loading" | "loaded" | "error";

export function AssetImage({ asset, className = "" }: { asset: VisualAssetDefinition; className?: string }) {
  const [state, setState] = useState<AssetLoadState>("loading");
  const position = asset.focalPoint ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%` : "50% 50%";
  return <div className={`asset-image ${className}`} data-load-state={state} style={{ aspectRatio: asset.aspectRatio.replace(":", " / ") }}>
    <div className="asset-fallback" role="img" aria-label={`${asset.alt} (이미지 준비 중)`}/>
    <img src={resolveAssetUrl(asset.src)} alt={asset.alt} loading="lazy" decoding="async" style={{ objectPosition: position }} onLoad={()=>setState("loaded")} onError={()=>setState("error")}/>
  </div>;
}

export function SceneMedia({ asset }: { asset?: VisualAssetDefinition }) {
  if (!asset || asset.kind === "evidence" || asset.referenceOnly) return null;
  return <AssetImage asset={asset} className={`scene-media scene-media-${asset.kind}`}/>;
}

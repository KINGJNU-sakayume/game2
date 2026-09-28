"use client";
import { useState, type ReactNode } from "react";
import type { VisualAssetDefinition } from "@/game/types";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";

export type AssetLoadState = "loading" | "loaded" | "error";

/**
 * A photograph with an atmospheric placeholder while it loads (or if it fails).
 * The exported site cannot use the Next.js image optimizer, and the WebP files
 * are already sized for delivery, so a plain <img> is intentional here.
 */
export function AssetImage({ asset, className = "", focalPoint, eager = false, fill = false, children }: {
  asset: VisualAssetDefinition;
  className?: string;
  focalPoint?: { x: number; y: number };
  eager?: boolean;
  /** Fill the parent instead of keeping the asset's own aspect ratio. */
  fill?: boolean;
  children?: ReactNode;
}) {
  const [state, setState] = useState<AssetLoadState>("loading");
  const focus = focalPoint ?? asset.focalPoint;
  const position = focus ? `${focus.x}% ${focus.y}%` : "50% 50%";
  return (
    <div className={`asset-image ${className}`} data-load-state={state} style={fill ? undefined : { aspectRatio: asset.aspectRatio.replace(":", " / ") }}>
      {state !== "loaded" && <div className="asset-fallback" role="img" aria-label={`${asset.alt} (${state === "error" ? "대체 이미지" : "이미지 준비 중"})`} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- static export; assets are pre-optimized WebP */}
      <img
        src={resolveAssetUrl(asset.src)}
        alt={state === "error" ? "" : asset.alt}
        aria-hidden={state === "error" || undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{ objectPosition: position }}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
      />
      {children}
    </div>
  );
}

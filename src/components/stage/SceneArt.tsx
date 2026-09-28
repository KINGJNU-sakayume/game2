"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SceneHotspot } from "@/game/types";
import { artKey, type SceneArt as Art } from "@/game/presentation/scene";
import { SceneHotspots } from "@/components/field/SceneHotspots";
import { AssetImage } from "./AssetImage";
import { IconSwipe } from "./icons";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Backdrop({ backdrop }: { backdrop: string }) {
  return <div className={`backdrop backdrop--${backdrop}`} aria-hidden="true"><i /><b /></div>;
}

/** A wide photograph the player can drag sideways to look around the room. */
function PanScene({ art, hotspots, disabled, onHotspot }: { art: Extract<Art, { type: "asset" }>; hotspots: SceneHotspot[]; disabled: boolean; onHotspot: (choiceId: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const positionedAt = useRef(0);
  const [explored, setExplored] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const focus = art.focalPoint?.x ?? 50;
    positionedAt.current = performance.now();
    element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) * (focus / 100));
  }, [art.asset.id]);
  // The initial centring fires a scroll event too; only a drag by the player counts as exploring.
  const onScroll = () => { if (performance.now() - positionedAt.current > 250) setExplored(true); };
  return (
    <div className="art-pan-wrap">
      <div className="art-pan" ref={scroller} onScroll={onScroll}>
        <div className="art-pan-track" style={{ aspectRatio: art.asset.aspectRatio.replace(":", " / ") }}>
          <AssetImage asset={art.asset} fill eager className="art-photo" />
          <SceneHotspots hotspots={hotspots} disabled={disabled} onHotspot={onHotspot} />
        </div>
      </div>
      {!explored && <p className="pan-hint" aria-hidden="true"><IconSwipe width={16} height={16} /> 밀어서 둘러보기</p>}
    </div>
  );
}

function Layer({ art, hotspots, disabled, onHotspot }: { art: Art; hotspots: SceneHotspot[]; disabled: boolean; onHotspot?: (choiceId: string) => void }) {
  if (art.type === "backdrop") return <Backdrop backdrop={art.key} />;
  if (hotspots.length && onHotspot) return <PanScene art={art} hotspots={hotspots} disabled={disabled} onHotspot={onHotspot} />;
  return <AssetImage asset={art.asset} focalPoint={art.focalPoint} fill eager className="art-photo art-drift" />;
}

/**
 * The stage background. Scene changes cross-fade: the previous layer stays
 * underneath until the new one has faded in.
 */
export function SceneArt({ art, hotspots = [], disabled = false, onHotspot, dim = false }: {
  art: Art;
  hotspots?: SceneHotspot[];
  disabled?: boolean;
  onHotspot?: (choiceId: string) => void;
  dim?: boolean;
}) {
  const key = artKey(art);
  const [layers, setLayers] = useState([{ key, art }]);
  if (layers[layers.length - 1].key !== key) setLayers([...layers.slice(-1), { key, art }]);
  useEffect(() => {
    if (layers.length < 2) return;
    const timer = window.setTimeout(() => setLayers((current) => current.slice(-1)), 900);
    return () => window.clearTimeout(timer);
  }, [layers.length]);
  const current = layers[layers.length - 1];
  return (
    <div className={`scene-art ${dim ? "is-dim" : ""}`} data-art={current.key}>
      {layers.map((layer, index) => (
        <div key={layer.key} className={`art-layer ${index === layers.length - 1 ? "is-current" : "is-leaving"}`}>
          <Layer art={index === layers.length - 1 ? art : layer.art} hotspots={index === layers.length - 1 ? hotspots : []} disabled={disabled} onHotspot={onHotspot} />
        </div>
      ))}
      <div className="art-grade" aria-hidden="true" />
    </div>
  );
}

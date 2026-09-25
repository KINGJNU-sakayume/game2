import type { SceneHotspot } from "@/game/types";

export function SceneHotspots({ hotspots, disabled, onHotspot }: {
  hotspots: SceneHotspot[];
  disabled: boolean;
  onHotspot: (choiceId: string) => void;
}) {
  if (!hotspots.length) return null;
  return <div className="scene-hotspots" role="group" aria-label="이미지 내 빠른 조사 지점. 같은 행동은 아래 선택지에서도 이용할 수 있습니다.">
    {hotspots.map((hotspot) => <button
      key={hotspot.id}
      type="button"
      className="scene-hotspot"
      data-hotspot-icon={hotspot.icon}
      aria-label={hotspot.label}
      disabled={disabled}
      onClick={() => onHotspot(hotspot.choiceId)}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: hotspot.width ? `${hotspot.width}%` : undefined, height: hotspot.height ? `${hotspot.height}%` : undefined }}
    ><span aria-hidden="true" /></button>)}
  </div>;
}

export function SceneHeader({ time, location }: { time?: string; location?: string }) {
  return <header className="scene-header" aria-label="현재 장면"><time>{time}</time><span>{location}</span></header>;
}

import { formatGameTime } from "@/game/abilities";
import type { GameState } from "@/game/types";
export function TimelineTab({ state }: { state: GameState }) { return <ol className="timeline-list">{[...(state.timeline ?? [])].sort((a,b) => a.time-b.time).map(item => <li key={item.id}><time>{formatGameTime(item.time)}</time><span>{item.text}</span></li>)}</ol>; }

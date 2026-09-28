import { formatGameTime } from "@/game/abilities";
import type { GameState } from "@/game/types";

const dayOffset = (time: number) => Math.floor(time / 1440);

export function TimelineTab({ state }: { state: GameState }) {
  const entries = [...(state.timeline ?? [])].sort((a, b) => a.time - b.time);
  if (!entries.length) return <p className="chart-empty">아직 기록된 경과가 없다.</p>;
  const firstDay = dayOffset(entries[0].time);
  return (
    <ol className="timeline">
      {entries.map((item) => {
        const day = dayOffset(item.time) - firstDay;
        return (
          <li key={item.id} data-kind={item.kind}>
            <time>{day > 0 && <small>+{day}일 </small>}{formatGameTime(item.time)}</time>
            <span>{item.text}</span>
          </li>
        );
      })}
    </ol>
  );
}

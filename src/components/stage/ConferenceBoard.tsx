import type { CSSProperties } from "react";

/** A small, stable tilt for each pinned card so the board looks handled, not generated. */
const tilt = (index: number) => (((index * 37) % 9) - 4) * 0.45;

/**
 * Case conference board. Findings are pinned as index cards, one handful per
 * tap, before the inner voices argue about them.
 */
export function ConferenceBoard({ groups }: { groups: string[][] }) {
  let index = 0;
  return (
    <div className="board" aria-label="증례 보드">
      <ul>
        {groups.flatMap((lines, group) => lines.filter(Boolean).map((line, position) => {
          const style = { "--tilt": `${tilt(index)}deg`, "--delay": `${position * 70}ms` } as CSSProperties;
          index += 1;
          return <li key={`${group}-${position}`} style={style}>{line}</li>;
        }))}
      </ul>
    </div>
  );
}

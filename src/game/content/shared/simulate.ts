import { ABILITY_NAMES, type ChapterDefinition, type GameState, type PlayerState } from "@/game/types";
import { advanceTimedNode, executeChoice, getAvailableChoices, isShellAction } from "@/game/engine/nodeResolver";
import { createRun } from "@/game/engine/runFactory";
import { nextRandom } from "@/game/engine/rng";

export interface SimulationReport {
  runs: number;
  completed: number;
  endings: Record<string, number>;
  visited: Set<string>;
  failures: string[];
}

/**
 * Plays a chapter many times with random abilities and random choices. It is
 * the pipeline's safety net: every reachable state must offer a way forward,
 * every run must close the case, and the report shows which content is never seen.
 */
export function simulateChapter(chapter: ChapterDefinition, { runs = 300, seed = 20260928, maxSteps = 900 }: { runs?: number; seed?: number; maxSteps?: number } = {}): SimulationReport {
  const report: SimulationReport = { runs, completed: 0, endings: {}, visited: new Set(), failures: [] };
  const completionNode = chapter.completion?.nodeId ?? "CASE_COMPLETE";
  let rng = seed >>> 0;
  const random = () => { const next = nextRandom(rng); rng = next.state; return next.value; };

  for (let run = 0; run < runs; run++) {
    const player: PlayerState = {
      name: "시뮬레이션",
      abilities: Object.fromEntries(ABILITY_NAMES.map((ability) => [ability, Math.floor(random() * 6)])) as PlayerState["abilities"],
    };
    let state: GameState = createRun(chapter, player, { seed: Math.floor(random() * 2 ** 31), timestamp: 1, runId: `sim-${run}` });
    let steps = 0;
    let finished = false;
    try {
      while (steps++ < maxSteps) {
        report.visited.add(state.currentNodeId);
        if (state.currentNodeId === completionNode) { finished = true; break; }
        const node = chapter.nodes[state.currentNodeId];
        if (node.autoNext && node.presentation?.autoAdvanceMs !== undefined) {
          state = advanceTimedNode(state, chapter, steps + 1);
          continue;
        }
        const choices = getAvailableChoices(node, state).filter((choice) => !isShellAction(choice));
        if (!choices.length) { report.failures.push(`run ${run}: dead end at ${node.id}`); break; }
        const choice = choices[Math.floor(random() * choices.length)];
        state = executeChoice(state, chapter, choice.id, steps + 1);
      }
      if (!finished && steps >= maxSteps) report.failures.push(`run ${run}: no completion after ${maxSteps} steps (at ${state.currentNodeId})`);
    } catch (error) {
      report.failures.push(`run ${run}: ${(error as Error).message}`);
    }
    if (finished) {
      report.completed += 1;
      const ending = String(state.values.ending_id ?? "none");
      report.endings[ending] = (report.endings[ending] ?? 0) + 1;
    }
  }
  return report;
}

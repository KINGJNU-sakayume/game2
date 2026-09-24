import type { ChapterDefinition } from "@/game/types";

export function validateChapterGraph(chapter: ChapterDefinition, checkpoints: readonly string[] = []): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(chapter.nodes));
  if (!ids.has(chapter.startNodeId)) errors.push(`Missing start node: ${chapter.startNodeId}`);
  const edges = new Map<string, string[]>();
  const automatic = new Map<string, string[]>();
  for (const node of Object.values(chapter.nodes)) {
    const targets: string[] = [];
    if (node.autoNext) { targets.push(node.autoNext); automatic.set(node.id, [node.autoNext]); }
    for (const choice of node.choices ?? []) {
      if ("terminal" in choice && choice.terminal) continue;
      if (!("next" in choice) || choice.next === undefined) { errors.push(`Choice ${node.id}/${choice.id} has no destination`); continue; }
      if (typeof choice.next === "string") targets.push(choice.next);
      else targets.push(choice.next.success, choice.next.failure);
    }
    edges.set(node.id, targets);
    for (const target of targets) if (!ids.has(target)) errors.push(`Missing target ${target} from ${node.id}`);
  }
  const reachable = new Set<string>();
  const visit = (id: string) => { if (reachable.has(id) || !ids.has(id)) return; reachable.add(id); for (const target of edges.get(id) ?? []) visit(target); };
  visit(chapter.startNodeId);
  for (const checkpoint of checkpoints) if (!reachable.has(checkpoint)) errors.push(`Unreachable checkpoint: ${checkpoint}`);
  const visiting = new Set<string>(); const visited = new Set<string>();
  const detect = (id: string) => { if (visiting.has(id)) { errors.push(`Automatic transition cycle at ${id}`); return; } if (visited.has(id)) return; visiting.add(id); for (const target of automatic.get(id) ?? []) detect(target); visiting.delete(id); visited.add(id); };
  for (const id of ids) detect(id);
  return errors;
}

import type { DiagnosisState, TimelineEntry } from "@/game/types";

export function setPrimaryDiagnosis(state: Record<string, DiagnosisState>, id: string) {
  return Object.fromEntries(Object.entries(state).map(([key,value])=>[key,{...value,isPrimary:key===id}]));
}
export function moveDiagnosis(state: Record<string, DiagnosisState>, id: string, direction: -1|1) {
  const ordered=Object.entries(state).filter(([,value])=>value.unlocked).sort((a,b)=>a[1].order-b[1].order); const from=ordered.findIndex(([key])=>key===id),to=from+direction;
  if(from<0||to<0||to>=ordered.length)return state; [ordered[from],ordered[to]]=[ordered[to],ordered[from]]; const next={...state}; ordered.forEach(([key],order)=>next[key]={...next[key],order}); return next;
}
export function toggleLinkedClue(state: Record<string, DiagnosisState>, diagnosisId:string, clueId:string) {
  const diagnosis=state[diagnosisId]; if(!diagnosis)return state; const linkedClues=diagnosis.linkedClues.includes(clueId)?diagnosis.linkedClues.filter(id=>id!==clueId):[...diagnosis.linkedClues,clueId]; return {...state,[diagnosisId]:{...diagnosis,linkedClues}};
}
export function appendTimeline(entries: TimelineEntry[], entry: TimelineEntry) { return entries.some(item=>item.id===entry.id)?entries:[...entries,entry].sort((a,b)=>a.time-b.time); }

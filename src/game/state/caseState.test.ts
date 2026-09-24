import { describe,expect,it } from "vitest";
import { appendTimeline,moveDiagnosis,setPrimaryDiagnosis,toggleLinkedClue } from "./caseState";
const state=()=>({a:{unlocked:true,isPrimary:true,linkedClues:[],order:0},b:{unlocked:true,isPrimary:false,linkedClues:[],order:1}});
describe("CASE state",()=>{
 it("keeps exactly one primary diagnosis",()=>expect(Object.values(setPrimaryDiagnosis(state(),"b")).filter(x=>x.isPrimary)).toHaveLength(1));
 it("reorders diagnoses",()=>expect(moveDiagnosis(state(),"b",-1).b.order).toBe(0));
 it("does not move beyond an edge",()=>expect(moveDiagnosis(state(),"a",-1)).toEqual(state()));
 it("links and unlinks evidence",()=>{const linked=toggleLinkedClue(state(),"a","na");expect(linked.a.linkedClues).toEqual(["na"]);expect(toggleLinkedClue(linked,"a","na").a.linkedClues).toEqual([])});
 it("allows one clue on several diagnoses",()=>{const a=toggleLinkedClue(state(),"a","na"),b=toggleLinkedClue(a,"b","na");expect(b.a.linkedClues).toContain("na");expect(b.b.linkedClues).toContain("na")});
 it("orders timeline chronologically",()=>expect(appendTimeline([{id:"b",time:2,kind:"test",text:"b"}],{id:"a",time:1,kind:"clinical",text:"a"}).map(x=>x.id)).toEqual(["a","b"]));
 it("deduplicates timeline IDs",()=>expect(appendTimeline([{id:"a",time:1,kind:"test",text:"a"}],{id:"a",time:2,kind:"test",text:"again"})).toHaveLength(1));
});

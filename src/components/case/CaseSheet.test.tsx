import { cleanup,fireEvent,render,screen } from "@testing-library/react";
import { afterEach,describe,expect,it,vi } from "vitest";
import { CaseSheet } from "./CaseSheet"; import { chapter01 } from "@/game/content/chapter01"; import type { GameState } from "@/game/types";
const state={runId:"r",chapterId:"chapter-01",currentNodeId:"ER_001",player:{name:"p",abilities:{observation:2,history:2,empathy:2,mechanism:2,reasoning:2,suspicion:2,decision:2}},patients:{harin:{id:"harin",name:"윤하린",trust:40,diseaseStage:"early",clues:["constipation"],diagnoses:["lead_poisoning"],tests:{urine_pbg_ala:"pending"}}},flags:{},values:{},time:1,resonance:{observation:0,history:0,empathy:0,mechanism:0,reasoning:0,suspicion:0,decision:0},rngState:1,checkResults:{},visitedNodeIds:[],diagnosisState:{lead_poisoning:{unlocked:true,isPrimary:false,linkedClues:[],order:0}},timeline:[],nodeEnteredAt:1,updatedAt:1} satisfies GameState;
const props={open:true,onClose:vi.fn(),chapter:chapter01,state,onPrimary:vi.fn(),onMove:vi.fn(),onLink:vi.fn()};
afterEach(cleanup);
describe("CaseSheet",()=>{
 it("is an accessible modal and only exposes acquired clue metadata",()=>{render(<CaseSheet {...props}/>);expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal","true");expect(screen.getByText("변비")).toBeInTheDocument();expect(screen.queryByText("constipation")).not.toBeInTheDocument()});
 it("switches tabs and labels pending tests",()=>{render(<CaseSheet {...props}/>);fireEvent.click(screen.getByRole("tab",{name:"TESTS"}));expect(screen.getByText("소변 PBG / ALA")).toBeInTheDocument();expect(screen.getByText("검사 중")).toBeInTheDocument()});
 it("shows only unlocked diagnoses without probability or score",()=>{render(<CaseSheet {...props}/>);fireEvent.click(screen.getByRole("tab",{name:"DDx"}));expect(screen.getByText("납중독")).toBeInTheDocument();expect(screen.queryByText(/확률|점수|%/)).not.toBeInTheDocument()});
 it("closes with Escape",()=>{const close=vi.fn();render(<CaseSheet {...props} onClose={close}/>);fireEvent.keyDown(document,{key:"Escape"});expect(close).toHaveBeenCalled()});
});

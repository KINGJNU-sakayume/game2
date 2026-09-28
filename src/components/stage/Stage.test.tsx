import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createRun } from "@/game/engine/runFactory";
import { useGameStore } from "@/game/state/gameStore";
import { useSettings } from "@/game/state/settingsStore";
import type { ChapterDefinition, PlayerState } from "@/game/types";
import { Stage } from "./Stage";

const player: PlayerState = { name: "테스트", abilities: { observation: 3, history: 2, empathy: 2, mechanism: 2, reasoning: 2, suspicion: 2, decision: 2 } };
const chapter: ChapterDefinition = {
  id: "stage-test",
  number: 9,
  title: "무대 테스트",
  subtitle: "무대 테스트",
  startNodeId: "A",
  initial: { time: 600, patients: { p: { id: "p", name: "환자", trust: 50, diseaseStage: "latent", clues: [], diagnoses: [], tests: {} } } },
  characters: { 간호사: { name: "간호사", role: "응급실", tone: "teal" } },
  clueDefinitions: { fever: { id: "fever", title: "발열 없음", category: "clinical" } },
  nodes: {
    A: { id: "A", presentation: { backdrop: "er" }, blocks: [{ type: "prose", text: "첫 줄." }, { type: "prose", text: "둘째 줄." }], choices: [{ id: "go-b", label: "계속", next: "B" }] },
    B: { id: "B", blocks: [{ type: "dialogue", speaker: "간호사", text: "“열은 없어요.”" }], onEnter: [{ type: "clue", patientId: "p", clueId: "fever" }], choices: [{ id: "go-pass", label: "계속", next: "PASS" }] },
    PASS: { id: "PASS", blocks: [], choices: [{ id: "go-c", label: "계속", next: "C" }] },
    C: { id: "C", blocks: [{ type: "prose", text: "고른다." }], choices: [{ id: "x", label: "“묻는다.”", next: "A" }, { id: "y", label: "진찰한다", check: { id: "c1", ability: "observation", dc: 2 }, next: { success: "A", failure: "A" } }] },
  },
};

const tap = () => fireEvent.click(screen.getByRole("button", { name: "다음" }));
const currentNode = () => useGameStore.getState().activeRun?.currentNodeId;

describe("Stage", () => {
  beforeEach(() => {
    useSettings.setState({ textSpeed: "instant", autoAdvance: false, loaded: true });
    useGameStore.setState({ activeRun: createRun(chapter, player, { seed: 3, timestamp: 1 }), hydrated: true, screen: "play", inputLocked: false, persistenceStatus: "healthy" });
  });
  const mount = () => render(<Stage chapter={chapter} run={useGameStore.getState().activeRun!} defaultPlayer={player} />);
  const Live = () => { const run = useGameStore((state) => state.activeRun)!; return <Stage chapter={chapter} run={run} defaultPlayer={player} />; };

  it("reveals one beat per tap, then taps through a single forward step", async () => {
    const { container } = render(<Live />);
    const lines = () => [...container.querySelectorAll(".prose .line")].map((line) => line.textContent);
    expect(lines()).toEqual(["첫 줄."]);
    tap();
    expect(lines()).toEqual(["첫 줄.", "둘째 줄."]);
    await act(async () => { tap(); });
    await waitFor(() => expect(currentNode()).toBe("B"));
    expect(container.querySelector(".speech .line")?.textContent).toBe("열은 없어요.");
    expect(container.querySelector(".speaker-role")?.textContent).toBe("응급실");
  });

  it("announces a newly recorded clue and badges the chart", async () => {
    render(<Live />);
    tap();
    await act(async () => { tap(); });
    await waitFor(() => expect(currentNode()).toBe("B"));
    expect(await screen.findByText("발열 없음")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /새 단서 1건/ })).toBeInTheDocument();
  });

  it("passes silently through empty nodes and stops at real choices", async () => {
    useGameStore.setState({ activeRun: { ...useGameStore.getState().activeRun!, currentNodeId: "B", visitedNodeIds: ["A", "B"] } });
    render(<Live />);
    await act(async () => { tap(); });
    await waitFor(() => expect(currentNode()).toBe("C"));
    const choices = await screen.findByRole("group", { name: "선택지" });
    expect(choices).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "진찰한다 (관찰 판정)" })).toBeInTheDocument();
  });

  it("keeps the case chart one tap away", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "환자 기록 열기" }));
    expect(screen.getByRole("dialog", { name: /환자/ })).toHaveAttribute("aria-modal", "true");
  });
});

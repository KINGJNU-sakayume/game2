import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceView } from "./EvidenceView";
import { chapter01VisualAssets } from "@/game/content/chapter01/visualAssets";

describe("EvidenceView", () => {
  const asset = chapter01VisualAssets.EVD_003_WEIGHT_NOTEBOOK;
  it("renders evidence data as HTML and opens an accessible modal", () => {
    render(<EvidenceView asset={asset}/>);
    expect(screen.getByText("51.2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /확대$/ }));
    expect(screen.getByRole("dialog", { name: "증거 확대" })).toHaveAttribute("aria-modal", "true");
    fireEvent.click(screen.getByRole("button", { name: "확대 이미지 닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("closes on Escape without changing external game state", () => {
    const state = Object.freeze({ time: 1328, flags: Object.freeze({ clue: false }) });
    render(<EvidenceView asset={asset}/>); fireEvent.click(screen.getByRole("button", { name: /확대$/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(state).toEqual({ time: 1328, flags: { clue: false } });
  });
  it("closes from the backdrop", () => {
    const { container } = render(<EvidenceView asset={asset}/>); fireEvent.click(screen.getByRole("button", { name: /확대$/ }));
    fireEvent.mouseDown(container.querySelector(".evidence-modal")!); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

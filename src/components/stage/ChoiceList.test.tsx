import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceList } from "./ChoiceList";

describe("ChoiceList", () => {
  it("provides accessible labels and executes a choice", () => {
    const choose = vi.fn();
    render(<ChoiceList choices={[{ id: "a", label: "표시 문구", ariaLabel: "명확한 선택", next: "b" }]} disabled={false} onChoose={choose} />);
    fireEvent.click(screen.getByRole("button", { name: "명확한 선택" }));
    expect(choose).toHaveBeenCalledWith("a");
  });
});

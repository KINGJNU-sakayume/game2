import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SceneHotspots } from "./SceneHotspots";
import { getVisibleHotspots } from "@/components/game/SceneRenderer";
import type { SceneHotspot } from "@/game/types";

const hotspots: SceneHotspot[] = [
  { id: "fridge-spot", label: "냉장고 조사", x: 8, y: 62, choiceId: "fridge" },
  { id: "desk-spot", label: "책상 조사", x: 38, y: 48, choiceId: "desk" },
];

describe("SceneHotspots", () => {
  it("uses native, percentage-positioned 44px touch buttons and the shared choice callback", () => {
    const choose = vi.fn(); render(<SceneHotspots hotspots={hotspots} disabled={false} onHotspot={choose}/>);
    const fridge = screen.getByRole("button", { name: "냉장고 조사" });
    expect(fridge).toHaveClass("scene-hotspot"); expect(fridge).toHaveStyle({ left: "8%", top: "62%" });
    fireEvent.click(fridge); expect(choose).toHaveBeenCalledWith("fridge");
  });
  it("disables every hotspot while choice input is locked", () => {
    render(<SceneHotspots hotspots={hotspots} disabled onHotspot={vi.fn()}/>);
    expect(screen.getAllByRole("button")).toEqual(expect.arrayContaining([expect.objectContaining({ disabled: true })]));
    screen.getAllByRole("button").forEach(button => expect(button).toBeDisabled());
  });
  it("hides hotspots whose choice is not currently available", () => {
    expect(getVisibleHotspots(hotspots, new Set(["desk"]))).toEqual([hotspots[1]]);
  });
});

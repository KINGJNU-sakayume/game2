import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssetImage } from "./AssetImage";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";
import { chapter01VisualAssets } from "@/game/content/chapter01/visualAssets";

const asset = chapter01VisualAssets.SCN_001_ER_INITIAL;
describe("AssetImage", () => {
  it("resolves root and GitHub Pages asset paths", () => {
    expect(resolveAssetUrl(asset.src, "")).toBe("/assets/chapter01/SCN_001_ER_INITIAL.webp");
    expect(resolveAssetUrl(asset.src, "/game2")).toBe("/game2/assets/chapter01/SCN_001_ER_INITIAL.webp");
  });
  it("shows an atmospheric fallback while loading", () => {
    const { container } = render(<AssetImage asset={asset} />);
    expect(container.querySelector(".asset-fallback")).toBeInTheDocument();
    expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "loading");
  });
  it("reveals the image on load and returns to the fallback on error without a broken icon", () => {
    const { container } = render(<AssetImage asset={asset} />);
    const image = screen.getByAltText(asset.alt);
    fireEvent.load(image);
    expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "loaded");
    expect(container.querySelector(".asset-fallback")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: asset.alt })).toHaveLength(1);
    fireEvent.error(image);
    expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "error");
    expect(screen.getByRole("img", { name: `${asset.alt} (대체 이미지)` })).toBeInTheDocument();
  });
  it("keeps the asset's aspect ratio unless it fills the stage", () => {
    const { container, rerender } = render(<AssetImage asset={asset} />);
    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe("16 / 9");
    rerender(<AssetImage asset={asset} fill />);
    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe("");
  });
});

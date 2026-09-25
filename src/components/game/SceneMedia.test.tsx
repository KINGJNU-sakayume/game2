import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SceneMedia } from "./SceneMedia";
import { resolveAssetUrl } from "@/game/presentation/assetUrl";
import { chapter01VisualAssets } from "@/game/content/chapter01/visualAssets";

const asset = chapter01VisualAssets.SCN_001_ER_INITIAL;
describe("SceneMedia", () => {
  it("resolves root and GitHub Pages asset paths", () => {
    expect(resolveAssetUrl(asset.src, "")).toBe("/assets/chapter01/SCN_001_ER_INITIAL.webp");
    expect(resolveAssetUrl(asset.src, "/game2")).toBe("/game2/assets/chapter01/SCN_001_ER_INITIAL.webp");
  });
  it("shows an atmospheric fallback while missing or loading", () => {
    const { container } = render(<SceneMedia asset={asset}/>);
    expect(container.querySelector(".asset-fallback")).toBeInTheDocument();
    expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "loading");
  });
  it("reveals an actual image on load and returns to fallback on error without a broken icon", () => {
    const { container } = render(<SceneMedia asset={asset}/>); const image = screen.getByAltText(asset.alt);
    fireEvent.load(image); expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "loaded");
    expect(container.querySelector(".asset-fallback")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: asset.alt })).toHaveLength(1);
    fireEvent.error(image); expect(container.querySelector(".asset-image")).toHaveAttribute("data-load-state", "error");
    expect(container.querySelector(".asset-fallback")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: `${asset.alt} (대체 이미지)` })).toBeInTheDocument();
  });
  it("does not render evidence through the scene hero path", () => {
    const { container } = render(<SceneMedia asset={chapter01VisualAssets.EVD_001_URINE}/>);
    expect(container).toBeEmptyDOMElement();
  });
});

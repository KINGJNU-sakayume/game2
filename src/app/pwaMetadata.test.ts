import { describe, expect, it } from "vitest";
import { metadata, viewport } from "./layout";

describe("root PWA metadata", () => {
  it("exposes the manifest and iOS standalone metadata", () => {
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.appleWebApp).toMatchObject({ capable: true, title: "비가 그친 뒤", statusBarStyle: "black-translucent" });
    expect(viewport).toMatchObject({ viewportFit: "cover", themeColor: "#11100f" });
  });
});

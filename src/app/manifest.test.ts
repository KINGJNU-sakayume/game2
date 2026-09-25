import { afterEach, describe, expect, it, vi } from "vitest";

describe("PWA manifest", () => {
  afterEach(() => vi.resetModules());

  it("uses root URLs in development and declares install icons", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    const manifest = (await import("./manifest")).default();
    expect(manifest).toMatchObject({
      name: "비가 그친 뒤",
      display: "standalone",
      theme_color: "#11100f",
      background_color: "#080d12",
      start_url: "/",
      scope: "/",
    });
    expect(manifest.icons).toEqual([
      expect.objectContaining({ src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }),
      expect.objectContaining({ src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }),
    ]);
  });

  it("prefixes production URLs exactly once", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/game2");
    const manifest = (await import("./manifest")).default();
    expect(manifest.start_url).toBe("/game2/");
    expect(manifest.scope).toBe("/game2/");
    expect(manifest.icons).toEqual([
      expect.objectContaining({ src: "/game2/icons/app-icon.svg" }),
      expect.objectContaining({ src: "/game2/icons/app-icon.svg" }),
    ]);
  });
});

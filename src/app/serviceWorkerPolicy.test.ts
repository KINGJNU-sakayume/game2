import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(`${process.cwd()}/public/sw.js`, "utf8");

describe("service worker policy", () => {
  it("ignores non-GET and out-of-scope requests", () => {
    expect(source).toContain('request.method !== "GET"');
    expect(source).toContain("url.origin !== scopeUrl.origin");
    expect(source).toContain("!url.pathname.startsWith(scopePath)");
  });

  it("uses network-first navigation with a cached shell fallback", () => {
    expect(source).toContain('request.mode === "navigate"');
    expect(source).toContain("networkFirst(request)");
    expect(source).toContain("caches.match(shellUrl)");
  });

  it("does not precache optional recovery imagery or force activation", () => {
    expect(source).not.toContain("SCN_007_RECOVERY");
    expect(source).not.toMatch(/install[\s\S]{0,300}skipWaiting/);
    expect(source).toContain('event.data?.type === "SKIP_WAITING"');
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

type Listener = () => void;

describe("PwaRegistration", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.restoreAllMocks(); });

  it("is disabled outside production and resolves the project URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/game2");
    const pwa = await import("./PwaRegistration");
    expect(pwa.shouldRegisterServiceWorker("development")).toBe(false);
    expect(pwa.shouldRegisterServiceWorker("production")).toBe(true);
    expect(pwa.getServiceWorkerUrl()).toBe("/game2/sw.js");
  });

  it("offers a waiting update and activates it only on user request", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/game2");
    const listeners = new Map<string, Listener>();
    const postMessage = vi.fn();
    const waiting = { postMessage } as unknown as ServiceWorker;
    const registration = {
      waiting,
      installing: null,
      addEventListener: vi.fn(),
    } as unknown as ServiceWorkerRegistration;
    const serviceWorker = {
      controller: {},
      register: vi.fn().mockResolvedValue(registration),
      addEventListener: vi.fn((name: string, listener: Listener) => listeners.set(name, listener)),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { reload } });
    const { PwaRegistration } = await import("./PwaRegistration");

    render(<PwaRegistration />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText("새 버전이 준비되었습니다.")).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    act(() => listeners.get("controllerchange")?.());
    act(() => listeners.get("controllerchange")?.());
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("dismisses the prompt without writing game state", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const registration = { waiting: { postMessage: vi.fn() }, installing: null, addEventListener: vi.fn() };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
      controller: {}, register: vi.fn().mockResolvedValue(registration), addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } });
    const { PwaRegistration } = await import("./PwaRegistration");
    render(<PwaRegistration />);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole("button", { name: "나중에" }));
    expect(screen.queryByText("새 버전이 준비되었습니다.")).not.toBeInTheDocument();
  });
});

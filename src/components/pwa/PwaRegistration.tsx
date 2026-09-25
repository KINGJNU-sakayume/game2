"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/config/pwa";

export const shouldRegisterServiceWorker = (environment = process.env.NODE_ENV) => environment === "production";
export const getServiceWorkerUrl = () => withBasePath("/sw.js");

export function PwaRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!shouldRegisterServiceWorker() || !("serviceWorker" in navigator)) return;

    let reloadRequested = false;
    const onControllerChange = () => {
      if (!reloadRequested) return;
      reloadRequested = false;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker);
      });
    };

    void navigator.serviceWorker.register(getServiceWorkerUrl(), { scope: withBasePath("/") }).then((result) => {
      if (result.waiting && navigator.serviceWorker.controller) setWaitingWorker(result.waiting);
      watchInstallingWorker(result.installing);
      result.addEventListener("updatefound", () => watchInstallingWorker(result.installing));
    }).catch(() => {
      // Service worker support is progressive enhancement; the game remains usable.
    });

    const requestReload = () => { reloadRequested = true; };
    window.addEventListener("pwa-reload-requested", requestReload);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("pwa-reload-requested", requestReload);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  const update = () => {
    window.dispatchEvent(new Event("pwa-reload-requested"));
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <aside className="pwa-update" role="status" aria-live="polite">
      <span>새 버전이 준비되었습니다.</span>
      <button type="button" onClick={update}>새로고침</button>
      <button type="button" className="pwa-update-later" onClick={() => setDismissed(true)}>나중에</button>
    </aside>
  );
}

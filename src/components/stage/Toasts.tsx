import type { CSSProperties } from "react";
import type { AbilityName } from "@/game/types";
import { IconFlask, IconPin } from "./icons";

export interface Toast { id: string; kind: "clue" | "test" | "check"; title: string; detail: string; ability?: AbilityName }

/** Quiet confirmations that something went into the chart. Never shows hidden numbers. */
export function Toasts({ toasts, lowered = false }: { toasts: Toast[]; lowered?: boolean }) {
  return (
    <div className={`toasts ${lowered ? "is-lowered" : ""}`} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <p key={toast.id} className="toast" data-kind={toast.kind} style={toast.ability ? { "--ability": `var(--ab-${toast.ability})` } as CSSProperties : undefined}>
          {toast.kind === "clue" ? <IconPin width={16} height={16} /> : toast.kind === "test" ? <IconFlask width={16} height={16} /> : null}
          <span className="toast-title">{toast.title}</span>
          <span className="toast-detail">{toast.detail}</span>
        </p>
      ))}
    </div>
  );
}

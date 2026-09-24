import type { ReactNode } from "react";
export function GameShell({ immersive, hasCase, children }: { immersive: boolean; hasCase: boolean; children: ReactNode }) { return <main className={`game-shell ${immersive ? "is-immersive" : ""} ${hasCase ? "has-case-button" : ""}`}>{children}</main>; }

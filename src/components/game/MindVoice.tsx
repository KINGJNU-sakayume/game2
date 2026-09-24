import { ABILITY_PRESENTATION } from "@/game/abilities";
import type { AbilityName } from "@/game/types";

export function MindVoice({ ability, label, children }: { ability?: AbilityName; label?: string; children: React.ReactNode }) {
  const voice = ability ? ABILITY_PRESENTATION[ability] : undefined;
  return <aside className={`mind-voice mind-voice-${ability ?? "plain"}`} aria-label={`내면의 목소리: ${voice?.name ?? label ?? "생각"}`}>
    <div className="mind-voice-label"><span aria-hidden="true">{voice?.symbol}</span> {voice?.name ?? label}</div>
    <p>{children}</p>
  </aside>;
}

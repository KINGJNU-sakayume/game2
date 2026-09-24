import { SceneRenderer } from "@/components/game/SceneRenderer";
import { chapter01, defaultPlayer } from "@/game/content/chapter01";

export default function Home() { return <SceneRenderer chapter={chapter01} player={defaultPlayer} />; }

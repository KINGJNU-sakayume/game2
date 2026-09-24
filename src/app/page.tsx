import { SceneRenderer } from "@/components/game/SceneRenderer";
import { defaultPlayer, demoChapter } from "@/game/content/demoChapter";

export default function Home() { return <SceneRenderer chapter={demoChapter} player={defaultPlayer} />; }

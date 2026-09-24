import type { NarrativeBlock as Block } from "@/game/types";
import { NarrativeBlock } from "./NarrativeBlock";
export function NarrativeFeed({ blocks }: { blocks: Block[] }) { return <div className="narrative-feed">{blocks.map((block, index) => <NarrativeBlock block={block} key={index} />)}</div>; }

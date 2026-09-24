import type { ChapterDefinition, PlayerState } from "@/game/types";

export const defaultPlayer: PlayerState = {
  name: "당직의",
  abilities: { observation: 1, empathy: 1, reasoning: 1, resolve: 1 },
};

export const demoChapter: ChapterDefinition = {
  id: "prologue", title: "비가 그친 뒤", startNodeId: "waiting-room",
  nodes: {
    "waiting-room": {
      id: "waiting-room", title: "새벽 2시 17분",
      blocks: [
        { type: "prose", text: "응급실 창문을 두드리던 비가 잦아들었다. 복도 끝의 호출등 하나만 고요히 깜박인다." },
        { type: "dialogue", speaker: "간호사", text: "선생님, 잠깐 와 보셔야 할 것 같아요." },
        { type: "thought", text: "아직 이야기가 시작되기 전이다. 먼저 어떤 태도로 다가갈지 정해야 한다." },
      ],
      choices: [
        { id: "listen", label: "말없이 고개를 끄덕인다", ariaLabel: "간호사의 이야기를 차분히 듣는다", effects: [{ type: "resonance", amount: 1 }], next: "corridor" },
        { id: "ask", label: "무슨 일인지 차분히 묻는다", next: "corridor" },
      ],
    },
    corridor: {
      id: "corridor", title: "긴 복도",
      blocks: [
        { type: "prose", text: "희미한 조명 아래, 발걸음 소리가 유난히 크게 울린다." },
        { type: "system", text: "프롤로그가 끝났습니다. 다음 이야기는 곧 이어집니다." },
      ],
    },
  },
};

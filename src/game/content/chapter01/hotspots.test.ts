import { describe, expect, it } from "vitest";
import { chapter01 } from "./index";

describe("Chapter 1 scene hotspot metadata", () => {
  it("maps apartment and rehearsal hotspots only to the requested existing choices", () => {
    const apartment = chapter01.nodes.APT_001; const rehearsal = chapter01.nodes.REH_001;
    expect(apartment.presentation?.hotspots?.map(({ choiceId }) => choiceId)).toEqual(["fridge", "vanity", "desk"]);
    expect(rehearsal.presentation?.hotspots?.map(({ choiceId }) => choiceId)).toEqual(["motor", "environment"]);
  });
  it("keeps every hotspot as a convenience path to a text choice on the same node", () => {
    for (const node of Object.values(chapter01.nodes)) {
      const choiceIds = new Set(node.choices?.map(choice => choice.id));
      for (const hotspot of node.presentation?.hotspots ?? []) {
        expect(choiceIds.has(hotspot.choiceId), `${node.id}:${hotspot.id}`).toBe(true);
        expect(hotspot.x).toBeGreaterThanOrEqual(0); expect(hotspot.x).toBeLessThanOrEqual(100);
        expect(hotspot.y).toBeGreaterThanOrEqual(0); expect(hotspot.y).toBeLessThanOrEqual(100);
      }
    }
  });
});

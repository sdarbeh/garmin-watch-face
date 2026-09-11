import { describe, expect, it } from "vitest";
import { matchesLayerQuery } from "@/components/editor/model/layer-search";

describe("layer search", () => {
  it("matches aliases and custom names without reordering placed layers", () => {
    expect(matchesLayerQuery("heartRate", "bpm", ["Resting pulse"])).toBe(true);
    expect(matchesLayerQuery("text", "lap label", ["Lap label"])).toBe(true);
    expect(matchesLayerQuery("text", "weather", ["Lap label"])).toBe(false);
  });
});

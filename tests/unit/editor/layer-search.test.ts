import { describe, expect, it } from "vitest";
import {
  matchesLayerQuery,
  searchLayerTypes,
} from "@/components/editor/model/layer-search";

describe("layer search", () => {
  it("preserves catalog order without a query", () => {
    expect(searchLayerTypes(["weather", "time", "battery"], "")).toEqual([
      "weather",
      "time",
      "battery",
    ]);
  });

  it("finds layers by useful aliases", () => {
    expect(searchLayerTypes(["time", "heartRate", "icon"], "pulse")).toEqual([
      "heartRate",
    ]);
    expect(searchLayerTypes(["weather", "recovery", "image"], "rain")).toEqual([
      "weather",
    ]);
  });

  it("requires every query word to match", () => {
    expect(
      searchLayerTypes(["battery", "bodyBattery", "calories"], "body energy"),
    ).toEqual(["bodyBattery"]);
  });

  it("matches aliases and custom names without reordering placed layers", () => {
    expect(matchesLayerQuery("heartRate", "bpm", ["Resting pulse"])).toBe(true);
    expect(matchesLayerQuery("text", "lap label", ["Lap label"])).toBe(true);
    expect(matchesLayerQuery("text", "weather", ["Lap label"])).toBe(false);
  });
});

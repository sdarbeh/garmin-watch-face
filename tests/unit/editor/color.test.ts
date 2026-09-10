import { expect, it } from "vitest";
import {
  hexToHsv,
  hsvToHex,
} from "../../../src/components/ui/color-picker/color";

it("preserves exact RGB values when converting between hex and picker coordinates", () => {
  for (const color of [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#C94D7C",
    "#123ABC",
    "#E84F97",
    "#808080",
  ]) {
    expect(hsvToHex(hexToHsv(color))).toBe(color);
  }
});
it("maps spectrum corners and brightness endpoints to expected colors", () => {
  expect(hsvToHex({ h: 0, s: 100, v: 100 })).toBe("#FF0000");
  expect(hsvToHex({ h: 360, s: 100, v: 100 })).toBe("#FF0000");
  expect(hsvToHex({ h: 120, s: 100, v: 100 })).toBe("#00FF00");
  expect(hsvToHex({ h: 240, s: 0, v: 100 })).toBe("#FFFFFF");
  expect(hsvToHex({ h: 180, s: 80, v: 0 })).toBe("#000000");
});

it("keeps recent colors valid, unique, newest-first and bounded", async () => {
  const { normalizeRecentColors } =
    await import("../../../src/components/ui/color-picker/recent-colors");
  expect(
    normalizeRecentColors(["#abc123", "bad", null, "#ABC123", "#FFFFFF"]),
  ).toEqual(["#ABC123", "#FFFFFF"]);
  expect(normalizeRecentColors({ color: "#FFFFFF" })).toEqual([]);
  expect(
    normalizeRecentColors(
      Array.from(
        { length: 12 },
        (_, i) => `#0000${i.toString(16).padStart(2, "0")}`,
      ),
    ),
  ).toHaveLength(8);
});

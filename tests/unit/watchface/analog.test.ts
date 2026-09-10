import { expect, it } from "vitest";
import { analogLines, analogTime } from "../../../src/watchface/analog";
import {
  createElement,
  presentation,
  serializeProject,
  parseProject,
} from "../../../src/watchface/schema";
import { getPreset } from "../../../src/presets/catalog";
import { powerLayout } from "../../../src/watchface/power";
import {
  renderModel,
  SAMPLE_DATA,
  layoutWarnings,
} from "../../../src/watchface/render-model";
import { graphicLines } from "../../../src/watchface/graphics";
import { generateProject } from "../../../src/watchface/generator";
it("rotates clockwise and advances the hour hand between hours", () => {
  const hand = analogTime(createElement("time", "hands"), 200);
  expect(analogLines(hand, "03:00")).toEqual([
    [
      [227, 227],
      [285, 227],
    ],
    [
      [227, 227],
      [227, 141],
    ],
  ]);
  expect(analogLines(hand, "15:00")).toEqual(analogLines(hand, "03:00"));
  const half = analogLines(hand, "03:30");
  expect(half[0][1][1]).toBeGreaterThan(227);
  expect(half[1][1]).toEqual([227, 313]);
});
it("shares simulated hands, serializes analog presets, and generates live clock drawing", () => {
  for (const slug of ["panda", "heritage-watch"]) {
    const design = getPreset(slug)!.design;
    expect(parseProject(serializeProject(design))).toEqual(design);
    const hand = renderModel(design, { ...SAMPLE_DATA, time: "10:10:30" }).find(
      (e) => e.type === "time",
    )!;
    expect(["analog", "analog-seconds"]).toContain(presentation(hand).variant);
    expect(graphicLines(hand)).toEqual(analogLines(hand, "10:10:30"));
    expect(layoutWarnings({ ...design, elements: [hand] })).toEqual([]);
    for (const mode of ["always-on", "low-battery", "night"] as const)
      expect(
        presentation(
          powerLayout(design, mode).elements.find((e) => e.type === "time")!,
        ).variant,
      ).toBe("analog");
    const source = Object.values(generateProject(design)).join("\n");
    expect(source).toContain("Math.sin");
    expect(source).toContain("clock.hour % 12 + clock.min / 60.0");
  }
});
it("includes the optional second hand in preview and suppresses it for AOD", () => {
  const design = structuredClone(getPreset("panda")!.design);
  const hand = design.layouts!["always-on"]!.elements.find(
    (e) => e.type === "time",
  )!;
  hand.presentation = { ...presentation(hand), variant: "analog-seconds" };
  expect(analogLines(hand, "10:10:30")).toHaveLength(3);
  const aod = powerLayout(design, "always-on");
  expect(
    presentation(aod.elements.find((e) => e.type === "time")!).variant,
  ).toBe("analog");
});

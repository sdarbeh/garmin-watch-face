import { presentation } from "@/watchface/schema";
import { expect, it } from "vitest";
import { presets, featuredPresets, getPreset } from "@/presets/catalog";
import {
  renderModel,
  layoutWarnings,
  SAMPLE_DATA,
} from "@/watchface/render-model";
import { generateProject } from "@/watchface/generator";
import { isGraphic } from "@/watchface/layer-catalog";

it("keeps the five featured faces and supplies ten distinct companion presets", () => {
  expect(featuredPresets.map((p) => p.slug)).toEqual([
    "simple",
    "vital-rings",
    "summit",
    "heritage-watch",
    "dot-matrix",
  ]);
  expect(presets).toHaveLength(15);
  expect(new Set(presets.map((p) => p.slug)).size).toBe(15);
  for (const { design } of presets) {
    expect(design.night?.enabled).toBe(true);
    const family = design.elements.find((e) => e.type === "time")?.family;
    for (const mode of ["always-on", "low-battery", "night"] as const) {
      const layout = design.layouts![mode]!;
      expect(layout.background).toBe("#000000");
      expect(layout.elements.find((e) => e.type === "time")?.family).toBe(
        mode === "night" ? family : (family ?? "garmin"),
      );
    }
    // Decorative rings/backgrounds may reach the edge; all text must fit.
    expect(
      layoutWarnings({
        ...design,
        elements: design.elements.filter(
          (e) => !isGraphic(e.type, presentation(e).variant),
        ),
      }),
    ).toEqual([]);
  }
});
it("renders split hours/minutes and generates the same clock components", () => {
  const design = getPreset("numerals")!.design;
  const samples = { ...SAMPLE_DATA, time: "23:47:12" };
  expect(
    renderModel(design, samples)
      .filter((e) => e.type === "time")
      .map((e) => e.sample),
  ).toEqual(["11", "47"]);
  const twentyFour = {
    ...design,
    elements: design.elements.map((e) => ({ ...e, timeFormat: "24" as const })),
  };
  expect(
    renderModel(twentyFour, samples)
      .filter((e) => e.type === "time")
      .map((e) => e.sample),
  ).toEqual(["23", "47"]);
  const source = Object.values(generateProject(twentyFour)).join("\n");
  expect(source).toContain('clock.hour.format("%02d")');
  expect(source).toContain('clock.min.format("%02d")');
});

it("replaces Track and Paper with Race Day and Weather Desk", () => {
  expect(getPreset("track")).toBeUndefined();
  expect(getPreset("paper")).toBeUndefined();
  expect(getPreset("race-day")?.design.background).toBe("#000000");
  const design = getPreset("weather-desk")!.design;
  const readings = renderModel(design)
    .filter(
      (e) =>
        e.type === "weather" && presentation(e).variant !== "condition-icon",
    )
    .map((e) => e.sample);
  expect(readings).toEqual(["22 C", "H 26", "L 18", "06:24", "19:18"]);
  const missing = renderModel(design, {
    ...SAMPLE_DATA,
    weatherHigh: undefined,
    weatherLow: undefined,
    sunrise: undefined,
    sunset: undefined,
  });
  expect(
    missing
      .filter(
        (e) =>
          e.type === "weather" && presentation(e).variant !== "condition-icon",
      )
      .map((e) => e.sample),
  ).toEqual(["22 C", "H --", "L --", "--", "--"]);
  const source = Object.values(generateProject(design)).join("\n");
  expect(source).toContain('id="Positioning"');
  expect(source).toContain("Weather.getSunrise");
  expect(source).toContain("Weather.getSunset");
  expect(source).toContain("conditions.highTemperature");
  expect(source).toContain("conditions.lowTemperature");
  expect(source).toContain("conditions.condition == 0");
  expect(source).toContain("conditions.condition == 3");
});

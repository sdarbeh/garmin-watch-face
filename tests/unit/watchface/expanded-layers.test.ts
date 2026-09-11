import { expect, it } from "vitest";
import {
  createElement,
  defaultDesign,
  presentation,
  parseProject,
  serializeProject,
  validateDesign,
} from "@/watchface/schema";
import { renderModel } from "@/watchface/render-model";
import { generateProject } from "@/watchface/generator";
import { usedImages } from "@/watchface/garmin-layers";
import { elementBounds } from "@/components/editor/model/geometry";
import { METRICS } from "@/watchface/layer-catalog";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==";
it("round trips every metric and generates real bindings with missing-data handling", () => {
  const layers = Object.keys(METRICS).map((type) =>
    createElement(type as keyof typeof METRICS, type),
  );
  let source = "";
  for (let i = 0; i < layers.length; i += 16) {
    const d = { ...defaultDesign(), elements: layers.slice(i, i + 16) };
    expect(parseProject(serializeProject(d))).toEqual(d);
    source += generateProject(d)["source/FaceApp.mc"];
  }
  expect(source).toContain("SensorHistory.getHeartRateHistory");
  expect(source).toContain("Weather.getCurrentConditions");
  expect(source).toContain('value == null ? "--"');
  expect(source).toContain("info.distance / 100000.0");
  expect(
    renderModel({
      ...defaultDesign(),
      elements: [createElement("distance", "distance")],
    })[0].sample,
  ).toBe("4.0 km");
});
it("uses the selected metric and goal for progress, with matching selection bounds", () => {
  const d = defaultDesign();
  const e = createElement("progress", "progress");
  e.presentation = {
    ...presentation(e),
    source: "battery",
    goal: 100,
    width: 120,
    height: 80,
  };
  d.elements = [e];
  const model = renderModel(d)[0];
  expect(model.ratio).toBe(0.82);
  expect(elementBounds(model)).toMatchObject({
    width: 120,
    height: 80,
    left: 167,
  });
  expect(generateProject(d)["source/FaceApp.mc"]).toContain(
    "drawProgress(dc, 227, 227, 120, 80, battery, 100, true)",
  );
});
it("rejects unknown variants, executable images, oversized dimensions and bad goals", () => {
  const d = defaultDesign();
  const e = createElement("image", "image");
  d.elements = [e];
  for (const patch of [
    { image: "https://example.com/a.png" },
    { width: 455 },
    { goal: 0 },
    { variant: "code" },
  ]) {
    e.presentation = {
      ...presentation(createElement("image", "image")),
      ...patch,
    };
    expect(() => validateDesign(d)).toThrow();
  }
});
it("embeds images portably and deduplicates identical resource sizes across layouts", () => {
  const d = defaultDesign();
  const e = createElement("image", "image");
  e.presentation = { ...presentation(e), image: png };
  d.elements = [e];
  d.layouts = { "low-battery": { background: "#000000", elements: [e] } };
  expect(parseProject(serializeProject(d))).toEqual(d);
  expect(usedImages(d)).toHaveLength(1);
  expect(generateProject(d)["resources/drawables.xml"]).toContain(
    'filename="image_0.png"',
  );
});
it("does not request sensor history or weather for a basic face", () => {
  const project = generateProject(defaultDesign());
  expect(project["manifest.xml"]).not.toContain('id="SensorHistory"');
  expect(project["source/FaceApp.mc"]).not.toContain(
    "Weather.getCurrentConditions()",
  );
});

it("allows an empty image while editing but requires an asset before building", () => {
  const d = defaultDesign();
  d.elements = [createElement("image", "empty-image")];
  expect(parseProject(serializeProject(d))).toEqual(d);
  expect(() => generateProject(d)).toThrow("An image layer is empty");
});

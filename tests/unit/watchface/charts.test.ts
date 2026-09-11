import { expect, it } from "vitest";
import { chartLines, sampleHistory } from "@/watchface/charts";
import {
  createElement,
  defaultDesign,
  validateDesign,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { graphicLines } from "@/watchface/graphics";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
it("preserves gaps without connecting across missing readings", () => {
  const lines = chartLines([60, 70, null, 80, 90], 100, 100, 100, 50, false);
  expect(lines).toHaveLength(2);
  expect(lines[0].map((p) => p[0])).toEqual([50, 75]);
  expect(lines[1].map((p) => p[0])).toEqual([125, 150]);
  expect(chartLines([null, null], 100, 100, 100, 50, false)).toEqual([]);
});
it("draws bars from zero and handles a constant series", () => {
  const bars = chartLines([60, null, 60], 100, 100, 100, 50, true);
  expect(bars).toHaveLength(2);
  expect(bars.every((line) => line[0][1] === 125)).toBe(true);
  expect(bars.flat(2).every(Number.isFinite)).toBe(true);
});
it("exports a real history iterator with permission and minute caching", () => {
  const chart = createElement("chart", "history");
  const design = validateDesign({ ...defaultDesign(), elements: [chart] });
  const source = Object.values(generateProject(design)).join("\n");
  expect(source).toContain('id="SensorHistory"');
  expect(source).toContain("new Time.Duration(span)");
  expect(source).toContain("sample.when.value()");
  expect(source).toContain("chartCache[key]");
  expect(source).toContain("drawHistory(dc");
  expect(() =>
    validateDesign({
      ...design,
      elements: [{ ...chart, chart: { hours: 99 } }],
    }),
  ).toThrow(/range/);
});
it("shows simulation gaps and empty history without changing the design", () => {
  const design = {
    ...defaultDesign(),
    elements: [createElement("chart", "history")],
  };
  expect(
    graphicLines(
      renderModel(design, { ...SAMPLE_DATA, chartPreview: "empty" })[0],
    ),
  ).toEqual([]);
  expect(
    graphicLines(
      renderModel(design, { ...SAMPLE_DATA, chartPreview: "gaps" })[0],
    ),
  ).toHaveLength(2);
  expect(sampleHistory("typical")).toHaveLength(32);
});

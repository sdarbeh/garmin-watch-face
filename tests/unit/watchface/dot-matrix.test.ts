import { expect, it } from "vitest";
import { getPreset } from "@/presets/catalog";
import { generateProject } from "@/watchface/generator";
import { renderModel, layoutWarnings } from "@/watchface/render-model";
import {
  simulationValues,
  DEFAULT_SIMULATION,
} from "@/components/editor/model/simulation";

it("renders and generates the full simulated date including the year", () => {
  const design = getPreset("dot-matrix")!.design;
  const samples = simulationValues(
    { ...DEFAULT_SIMULATION, date: "2028-02-29", time: "21:34:51" },
    "normal",
  );
  expect(
    renderModel(design, samples).find((e) => e.type === "date")?.sample,
  ).toBe("TUE 29 FEB 2028");
  expect(Object.values(generateProject(design)).join("\n")).toContain(
    'today.year.format("%d")',
  );
  expect(
    renderModel(design, samples).find((e) => e.type === "battery")?.sample,
  ).toBe("82%");
  expect(design.elements.every((e) => e.color === "#FFFFFF")).toBe(true);
  expect(
    renderModel(design, samples).find((e) => e.type === "time")?.sample,
  ).toBe("21:34:51");
  expect(design.elements.find((e) => e.type === "battery")?.family).toBe(
    "doto",
  );
  expect(layoutWarnings(design)).toEqual([]);
});

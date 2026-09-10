import { expect, it } from "vitest";
import {
  createElement,
  defaultDesign,
  presentation,
  validateDesign,
} from "../../../src/watchface/schema";
import {
  defaultFormat,
  formattedValue,
} from "../../../src/watchface/formatting";
import { renderModel } from "../../../src/watchface/render-model";
import { generateProject } from "../../../src/watchface/generator";
import { graphicLines } from "../../../src/watchface/graphics";
import { weatherIcon } from "../../../src/watchface/weather";

it("converts temperatures, distance and wind with precision and custom text", () => {
  const f = {
    ...defaultFormat("weather"),
    units: "imperial" as const,
    decimals: 1,
  };
  expect(formattedValue(0, "weather", "temperature", f)).toBe("32.0 F");
  expect(formattedValue(-40, "weather", "temperature", f)).toBe("-40.0 F");
  expect(formattedValue(10, "weather", "wind", f)).toBe("22.4 mph");
  expect(formattedValue(10, "distance", "value", f)).toBe("6.2");
  expect(
    formattedValue(70, "heartRate", "value", {
      ...f,
      decimals: 0,
      prefix: "HR ",
      suffix: " bpm",
    }),
  ).toBe("HR 70 bpm");
  expect(formattedValue(NaN, "weather", "temperature", f)).toBe("--");
});
it("preserves formatting through validation and emits the same conversion in export", () => {
  const element = createElement("weather", "weather");
  element.formatting = {
    ...defaultFormat("weather"),
    units: "imperial",
    decimals: 1,
  };
  const design = validateDesign({ ...defaultDesign(), elements: [element] });
  expect(renderModel(design)[0].sample).toBe("71.6 F");
  const source = Object.values(generateProject(design)).join("\n");
  expect(source).toContain('1.8, 32, "%.1f"');
  expect(() =>
    validateDesign({
      ...design,
      elements: [
        { ...element, formatting: { ...element.formatting, decimals: 3 } },
      ],
    }),
  ).toThrow(/formatting/);
});
it("uses condition-specific polylines with unknown data fallback", () => {
  const element = createElement("weather", "weather");
  element.presentation = {
    ...presentation(element),
    variant: "condition-icon",
  };
  const clear = graphicLines({ ...element, sample: "0" });
  const rain = graphicLines({ ...element, sample: "3" });
  expect(clear).not.toEqual(rain);
  expect(weatherIcon(15)).toBe("rain");
  expect(weatherIcon(53)).toBe("unknown");
  const source = Object.values(
    generateProject({ ...defaultDesign(), elements: [element] }),
  ).join("\n");
  expect(source).toContain("conditions.condition == 15");
  expect(source).toContain("conditions != null");
});

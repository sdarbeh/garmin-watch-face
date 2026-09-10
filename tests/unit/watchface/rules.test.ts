import { expect, it } from "vitest";
import {
  defaultDesign,
  createElement,
  validateDesign,
} from "../../../src/watchface/schema";
import {
  ruleAppearance,
  type AppearanceRule,
} from "../../../src/watchface/rules";
import { renderModel, SAMPLE_DATA } from "../../../src/watchface/render-model";
import { generateProject } from "../../../src/watchface/generator";
const rule: AppearanceRule = {
  source: "battery",
  comparison: "lt",
  threshold: 20,
  effect: "color",
  color: "#FF4444",
};
it("applies color at the threshold and restores the base when it stops matching", () => {
  expect(
    ruleAppearance([rule], { ...SAMPLE_DATA, battery: "19%" }, "#FFFFFF").color,
  ).toBe("#FF4444");
  expect(
    ruleAppearance([rule], { ...SAMPLE_DATA, battery: "20%" }, "#FFFFFF").color,
  ).toBe("#FFFFFF");
  expect(
    ruleAppearance([rule], { ...SAMPLE_DATA, battery: "--" }, "#FFFFFF").color,
  ).toBe("#FFFFFF");
});
it("gives hide priority and lets the last matching color win", () => {
  const result = ruleAppearance(
    [rule, { ...rule, color: "#00FF00" }, { ...rule, effect: "hide" }],
    { ...SAMPLE_DATA, battery: "10" },
    "#FFFFFF",
  );
  expect(result).toEqual({ color: "#00FF00", visible: false });
});
it("keeps conditionally hidden layers and source permissions in generated output", () => {
  const e = {
    ...createElement("text", "notice"),
    text: "LOW",
    rules: [
      {
        ...rule,
        source: "heartRate" as const,
        threshold: 100,
        effect: "hide" as const,
      },
    ],
  };
  const d = validateDesign({ ...defaultDesign(), elements: [e] });
  expect(renderModel(d)).toHaveLength(0);
  const source = Object.values(generateProject(d)).join("\n");
  expect(source).toContain('id="SensorHistory"');
  expect(source).toContain("heartRate != null && heartRate < 100");
  expect(source).toContain('"LOW"');
});
it("rejects unsupported rules and excessive rule lists", () => {
  const e = {
    ...createElement("text", "label"),
    rules: [{ ...rule, comparison: "arbitrary" }],
  };
  expect(() => validateDesign({ ...defaultDesign(), elements: [e] })).toThrow(
    /rule/,
  );
  expect(() =>
    validateDesign({
      ...defaultDesign(),
      elements: [{ ...e, rules: Array(5).fill(rule) }],
    }),
  ).toThrow(/four/);
});

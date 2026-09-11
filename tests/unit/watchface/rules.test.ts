import { expect, it } from "vitest";
import {
  defaultDesign,
  createElement,
  validateDesign,
} from "@/watchface/schema";
import {
  reorderRules,
  ruleAppearance,
  ruleConflicts,
  ruleSummary,
  type AppearanceRule,
} from "@/watchface/rules";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
import { generateProject } from "@/watchface/generator";
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

it("describes, reorders, and diagnoses rule priority", () => {
  const warning = { ...rule, comparison: "lte" as const, threshold: 20 };
  const critical = { ...warning, threshold: 10, color: "#AA0000" };
  expect(ruleSummary(warning)).toBe(
    "Change color when battery is at or below 20% battery.",
  );
  expect(reorderRules([warning, critical], 0, 1)).toEqual([critical, warning]);
  expect(ruleConflicts([warning, critical])).toEqual([]);
  expect(ruleConflicts([critical, warning])).toEqual([
    { first: 0, second: 1, kind: "overlap" },
  ]);
  expect(ruleConflicts([warning, { ...warning, color: "#00FF00" }])).toEqual([
    { first: 0, second: 1, kind: "duplicate" },
  ]);
});

import { expect, it } from "vitest";
import { matchesRule, ruleAppearance } from "@/watchface/rules";
import { defaultMetricRules } from "@/watchface/default-rules";
import {
  defaultDesign,
  createElement,
  validateDesign,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { SAMPLE_DATA } from "@/watchface/render-model";
import { addLayer, duplicateLayer } from "@/components/editor/model/layers";
import { withMetricFeedback } from "@/presets/feedback";
it("compares to the user's current goal and ignores missing or invalid goals", () => {
  const rule = defaultMetricRules("steps")[0];
  expect(matchesRule(rule, 8000, 8000)).toBe(true);
  expect(matchesRule(rule, 8000, 10000)).toBe(false);
  for (const goal of [null, undefined, 0, -1, NaN])
    expect(matchesRule(rule, 8000, goal)).toBe(false);
  expect(matchesRule({ ...rule, threshold: 50 }, 4000, 8000)).toBe(true);
  expect(
    ruleAppearance(
      [rule],
      { ...SAMPLE_DATA, steps: "8000", goals: { steps: 8000 } },
      "#FFFFFF",
    ).color,
  ).toBe(rule.color);
});
it("validates goal sources and exports guarded device goals", () => {
  const design = {
    ...defaultDesign(),
    elements: [
      { ...createElement("steps", "s"), rules: defaultMetricRules("steps") },
      { ...createElement("floors", "f"), rules: defaultMetricRules("floors") },
    ],
  };
  expect(validateDesign(design).elements[0].rules![0].target).toBe("goal");
  const output = generateProject(design)["source/FaceApp.mc"];
  expect(output).toContain("info.stepGoal");
  expect(output).toContain("info.floorsClimbedGoal");
  expect(output).toContain("stepsGoal != null && stepsGoal > 0");
  expect(output).toContain("(stepsGoal.toFloat() * 100 / 100.0)");
  expect(() =>
    validateDesign({
      ...design,
      elements: [
        {
          ...design.elements[0],
          rules: [
            { ...defaultMetricRules("steps")[0], source: "activeMinutes" },
          ],
        },
      ],
    }),
  ).toThrow(/rule/);
});
it("adds editable defaults only at creation and leaves customized rules alone", () => {
  const original = {
    ...defaultDesign(),
    elements: [createElement("battery", "existing")],
  };
  const added = addLayer(original, "battery", "new");
  expect(added.elements[0].rules).toHaveLength(2);
  expect(added.elements[1].rules).toBeUndefined();
  const battery = added.elements[0];
  expect(
    ruleAppearance(
      battery.rules!,
      { ...SAMPLE_DATA, battery: "10" },
      battery.color,
    ).color,
  ).toBe(battery.rules![1].color);
  expect(
    addLayer(original, "heartRate", "heart").elements[0].rules,
  ).toBeUndefined();
  expect(
    addLayer(original, "battery", "aod", "always-on").elements[0].rules,
  ).toBeUndefined();
  expect(
    addLayer(original, "battery", "night", "night").elements[0].rules![1].color,
  ).not.toBe(battery.rules![1].color);
  const customized = { ...original, elements: [{ ...battery, rules: [] }] };
  expect(duplicateLayer(customized, "new", "copy").elements[1].rules).toEqual(
    [],
  );
  expect(withMetricFeedback(customized).elements[0].rules).toEqual([]);
});

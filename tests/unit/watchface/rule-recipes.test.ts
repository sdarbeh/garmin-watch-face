import { expect, it } from "vitest";
import { createElement } from "@/watchface/schema";
import {
  createAppearanceRule,
  elementRuleSource,
  ruleCandidatesForSource,
} from "@/watchface/rule-recipes";

it("resolves sources for progress and complication layers", () => {
  const progress = createElement("progress", "progress");
  progress.presentation = {
    variant: "ring",
    width: 100,
    height: 100,
    stroke: 4,
    goal: 100,
    source: "bodyBattery",
    image: "",
  };
  expect(elementRuleSource(progress)).toBe("bodyBattery");
  expect(ruleCandidatesForSource("bodyBattery", "normal")[0].id).toBe(
    "energy-low",
  );

  const complication = createElement("complication", "complication");
  complication.complication = {
    source: "pulseOx",
    showUnit: true,
    openOnHold: false,
  };
  expect(elementRuleSource(complication)).toBe("pulseOx");
  expect(ruleCandidatesForSource("pulseOx", "normal")[0].id).toBe("oxygen-low");
});

it("uses mode-aware colors without changing the conditions", () => {
  const normal = ruleCandidatesForSource("battery", "normal")[0].rule;
  const night = ruleCandidatesForSource("battery", "night")[0].rule;
  expect(night.color).not.toBe(normal.color);
  expect({ ...night, color: normal.color }).toEqual(normal);
});

it("starts manual rules with the source's most useful threshold", () => {
  expect(createAppearanceRule("battery", true, "normal")).toMatchObject({
    comparison: "lte",
    threshold: 20,
    effect: "color",
  });
  expect(createAppearanceRule("stress", false, "normal")).toMatchObject({
    comparison: "gte",
    threshold: 51,
    effect: "hide",
  });
});

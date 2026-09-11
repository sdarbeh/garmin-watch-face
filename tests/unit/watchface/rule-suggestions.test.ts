import { describe, expect, it } from "vitest";
import { getDeviceById } from "@/devices/catalog";
import {
  createElement,
  presentation,
  type FaceElement,
} from "@/watchface/schema";
import {
  addRuleSuggestion,
  ruleSuggestionsFor,
  suggestionInsertionIndex,
} from "@/watchface/rule-suggestions";
import {
  defaultRulesForSource,
  ruleCandidatesForSource,
} from "@/watchface/rule-recipes";
import {
  compareRuleConditions,
  ruleAppearance,
  validateRules,
  type AppearanceRule,
} from "@/watchface/rules";
import { SAMPLE_DATA } from "@/watchface/render-model";

const device = getDeviceById("fr970")!;
const battery = (rules: AppearanceRule[] = []): FaceElement => ({
  ...createElement("battery", "battery"),
  rules,
});
const options = (element: FaceElement) =>
  ruleSuggestionsFor(element, device, "normal");
const ids = (element: FaceElement) => options(element).map((item) => item.id);
const low = ruleCandidatesForSource("battery", "normal")[0].rule;
const critical = ruleCandidatesForSource("battery", "normal")[1].rule;

describe("context-aware suggestions", () => {
  it("offers individual missing rules and disappears when defaults are configured", () => {
    expect(ids(battery())).toEqual(["battery-low", "battery-critical"]);
    expect(ids(battery([low]))).toEqual(["battery-critical"]);
    expect(ids(battery([critical]))).toEqual(["battery-low"]);
    expect(ids(battery(defaultRulesForSource("battery", "normal")))).toEqual(
      [],
    );
  });

  it("recognizes custom colors, thresholds, strict comparisons and reordered rules", () => {
    const customLow = {
      ...low,
      comparison: "lt" as const,
      threshold: 25,
      color: "#00FFAA",
    };
    const customCritical = { ...critical, threshold: 8, color: "#FF00FF" };
    expect(ids(battery([customLow]))).toEqual(["battery-critical"]);
    expect(ids(battery([customCritical]))).toEqual(["battery-low"]);
    expect(ids(battery([customCritical, customLow]))).toEqual([]);
    // Two edited warnings account for both levels, even if both moved closer to 20%.
    expect(
      ids(
        battery([
          { ...low, threshold: 18 },
          { ...critical, threshold: 16 },
        ]),
      ),
    ).toEqual([]);
  });

  it("offers halfway progress before an existing goal rule, preserving the user's goal and color", () => {
    const steps = createElement("steps", "steps");
    steps.rules = defaultRulesForSource("steps", "normal").map((rule) => ({
      ...rule,
      color: "#FF00FF",
    }));
    expect(ids(steps)).toEqual(["steps-halfway"]);
    const added = addRuleSuggestion(steps, device, "normal", "steps-halfway")!;
    expect(added.index).toBe(0);
    expect(added.rules[1]).toBe(steps.rules[0]);
    expect(added.rules.every((rule) => rule.target === "goal")).toBe(true);
    expect(
      ruleAppearance(
        added.rules,
        { ...SAMPLE_DATA, steps: "8000", goals: { steps: 8000 } },
        "#FFFFFF",
      ).color,
    ).toBe("#FF00FF");
  });

  it.each([
    "sunrise",
    "sunset",
    "humidity",
    "wind",
    "condition-icon",
    "high",
    "low",
    "feels-like",
  ])("does not suggest current temperature rules for weather %s", (variant) => {
    const weather = createElement("weather", "weather");
    weather.presentation = { ...presentation(weather), variant };
    expect(options(weather)).toEqual([]);
  });

  it.each(["labeled", "value", "temperature", "ring", "bar"])(
    "supports weather %s",
    (variant) => {
      const weather = createElement("weather", "weather");
      weather.presentation = { ...presentation(weather), variant };
      expect(ids(weather)).toEqual(["freezing", "hot-weather"]);
    },
  );

  it("uses progress and complication sources and distinguishes sensor temperature from weather", () => {
    const progress = createElement("progress", "progress");
    progress.presentation = { ...presentation(progress), source: "battery" };
    expect(ids(progress)).toEqual(ids(battery()));
    const complication = createElement("complication", "complication");
    complication.complication = {
      source: "pulseOx",
      showUnit: true,
      openOnHold: false,
    };
    expect(ids(complication)).toEqual(["oxygen-low", "oxygen-lower"]);
    const chart = createElement("chart", "chart");
    chart.chart = { ...chart.chart!, source: "temperature" };
    expect(options(chart)).toEqual([]);
  });

  it("respects capacity, mode support and recolor support", () => {
    expect(options(battery(Array.from({ length: 4 }, () => low)))).toEqual([]);
    expect(
      ruleSuggestionsFor(
        battery(),
        {
          capabilities: {
            layers: [],
            alwaysOn: false,
            lowBattery: false,
            nightLayout: false,
          },
        },
        "normal",
      ),
    ).toEqual([]);
    expect(
      ruleSuggestionsFor(
        battery(),
        {
          capabilities: {
            layers: ["battery"],
            alwaysOn: false,
            lowBattery: false,
            nightLayout: false,
          },
        },
        "night",
      ),
    ).toEqual([]);
    expect(options(createElement("image", "image"))).toEqual([]);
    expect(options(createElement("time", "time"))).toEqual([]);
    expect(
      options(
        battery([
          low,
          { ...low, source: "steps", effect: "hide" },
          { ...low, source: "weather", effect: "hide" },
        ]),
      ),
    ).toHaveLength(1);
  });
});

describe("safe additive application", () => {
  it("preserves existing rules and inserts specific warnings after broad warnings", () => {
    const customLow = { ...low, threshold: 25, color: "#00FFAA" };
    const element = battery([customLow]);
    const added = addRuleSuggestion(
      element,
      device,
      "normal",
      "battery-critical",
    )!;
    expect(added.index).toBe(1);
    expect(added.rules).toEqual([customLow, critical]);
    expect(added.rules[0]).toBe(customLow);
    expect(element.rules).toEqual([customLow]);
    expect(
      ruleAppearance(added.rules, { ...SAMPLE_DATA, battery: "8" }, "#FFFFFF")
        .color,
    ).toBe(critical.color);
    expect(
      ruleAppearance(added.rules, { ...SAMPLE_DATA, battery: "22" }, "#FFFFFF")
        .color,
    ).toBe(customLow.color);
    expect(validateRules(added.rules, device, true)).toHaveLength(2);
  });

  it("inserts a broad warning before a specific warning without reordering custom rules", () => {
    const hidden = {
      ...low,
      source: "steps" as const,
      effect: "hide" as const,
    };
    const element = battery([hidden, critical]);
    const added = addRuleSuggestion(element, device, "normal", "battery-low")!;
    expect(added.rules).toEqual([hidden, low, critical]);
    expect(added.index).toBe(1);
  });

  it("does not offer ineffective or ambiguous additions", () => {
    expect(
      options(battery([{ ...low, threshold: 100, effect: "hide" }])),
    ).toEqual([]);
    expect(options(battery([{ ...low, source: "weather" }]))).toEqual([]);
    expect(
      suggestionInsertionIndex(
        [{ ...low, comparison: "gte", threshold: 15 }],
        low,
      ),
    ).toBeNull();
    expect(
      suggestionInsertionIndex([{ ...low, target: "goal" }], low),
    ).toBeNull();
    // Specific-before-broad custom ordering leaves no safe insertion slot for a middle band.
    expect(
      suggestionInsertionIndex([critical, low], { ...low, threshold: 15 }),
    ).toBeNull();
  });

  it("allows re-adding a removed rule, rejects stale additions, and never exceeds four rules", () => {
    const element = battery([low]);
    expect(
      addRuleSuggestion(element, device, "normal", "battery-low"),
    ).toBeNull();
    expect(
      addRuleSuggestion(element, device, "normal", "missing-id"),
    ).toBeNull();
    expect(
      addRuleSuggestion(battery(), device, "normal", "battery-low")?.rules,
    ).toEqual([low]);
    expect(
      addRuleSuggestion(
        battery([low, low, low, low]),
        device,
        "normal",
        "battery-critical",
      ),
    ).toBeNull();
    const added = addRuleSuggestion(
      element,
      device,
      "normal",
      "battery-critical",
    )!;
    expect(
      addRuleSuggestion(
        { ...element, rules: added.rules },
        device,
        "normal",
        "battery-critical",
      ),
    ).toBeNull();
  });

  it("handles inclusive boundary conditions", () => {
    expect(compareRuleConditions(low, { ...low, comparison: "lt" })).toBe(
      "contains",
    );
    expect(compareRuleConditions(low, { ...low, comparison: "gt" })).toBe(
      "disjoint",
    );
    expect(compareRuleConditions(low, { ...low, comparison: "gte" })).toBe(
      "overlap",
    );
  });
});

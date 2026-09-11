import { isMetric, METRICS, type Metric } from "./layer-catalog";
import type { PowerMode } from "./power";
import { type AppearanceRule } from "./rules";
import type { FaceElement } from "./schema";

export interface RuleCandidate {
  id: string;
  label: string;
  rule: AppearanceRule;
}

type RuleColor = "caution" | "danger" | "success" | "cool" | "warm";

interface RuleDefinition {
  id: string;
  label: string;
  comparison: AppearanceRule["comparison"];
  threshold: number;
  color: RuleColor;
  target?: "goal";
  default?: boolean;
}

// Each entry is one editable rule. Defaults and suggestions share these values.
const RULE_DEFINITIONS: Partial<Record<Metric, RuleDefinition[]>> = {
  battery: [
    {
      id: "battery-low",
      label: "Low battery",
      comparison: "lte",
      threshold: 20,
      color: "caution",
      default: true,
    },
    {
      id: "battery-critical",
      label: "Critical battery",
      comparison: "lte",
      threshold: 10,
      color: "danger",
      default: true,
    },
  ],
  stress: [
    {
      id: "stress-elevated",
      label: "Elevated stress",
      comparison: "gte",
      threshold: 51,
      color: "caution",
      default: true,
    },
    {
      id: "stress-high",
      label: "High stress",
      comparison: "gte",
      threshold: 76,
      color: "danger",
      default: true,
    },
  ],
  bodyBattery: [
    {
      id: "energy-low",
      label: "Low Body Battery",
      comparison: "lte",
      threshold: 50,
      color: "caution",
      default: true,
    },
    {
      id: "energy-critical",
      label: "Very low Body Battery",
      comparison: "lte",
      threshold: 25,
      color: "danger",
      default: true,
    },
  ],
  steps: [
    {
      id: "steps-halfway",
      label: "Halfway to your daily goal",
      comparison: "gte",
      threshold: 50,
      color: "caution",
      target: "goal",
    },
    {
      id: "steps-goal",
      label: "Daily goal reached",
      comparison: "gte",
      threshold: 100,
      color: "success",
      target: "goal",
      default: true,
    },
  ],
  floors: [
    {
      id: "floors-halfway",
      label: "Halfway to your daily goal",
      comparison: "gte",
      threshold: 50,
      color: "caution",
      target: "goal",
    },
    {
      id: "floors-goal",
      label: "Daily goal reached",
      comparison: "gte",
      threshold: 100,
      color: "success",
      target: "goal",
      default: true,
    },
  ],
  heartRate: [
    {
      id: "heart-rate-elevated",
      label: "Elevated heart rate",
      comparison: "gte",
      threshold: 120,
      color: "caution",
    },
    {
      id: "heart-rate-high",
      label: "High heart rate",
      comparison: "gte",
      threshold: 160,
      color: "danger",
    },
  ],
  pulseOx: [
    {
      id: "oxygen-low",
      label: "Low Pulse Ox",
      comparison: "lte",
      threshold: 95,
      color: "caution",
    },
    {
      id: "oxygen-lower",
      label: "Lower Pulse Ox",
      comparison: "lte",
      threshold: 90,
      color: "danger",
    },
  ],
  respiration: [
    {
      id: "respiration-elevated",
      label: "Elevated respiration",
      comparison: "gte",
      threshold: 20,
      color: "caution",
    },
    {
      id: "respiration-high",
      label: "High respiration",
      comparison: "gte",
      threshold: 25,
      color: "danger",
    },
  ],
  weather: [
    {
      id: "freezing",
      label: "Freezing weather",
      comparison: "lte",
      threshold: 0,
      color: "cool",
    },
    {
      id: "hot-weather",
      label: "Hot weather",
      comparison: "gte",
      threshold: 30,
      color: "warm",
    },
  ],
  recovery: [
    {
      id: "recovered",
      label: "Fully recovered",
      comparison: "eq",
      threshold: 0,
      color: "success",
      default: true,
    },
  ],
  notifications: [
    {
      id: "notifications-high",
      label: "Unread notifications",
      comparison: "gte",
      threshold: 10,
      color: "caution",
    },
  ],
  calories: [
    {
      id: "calorie-target",
      label: "Calorie target",
      comparison: "gte",
      threshold: 2000,
      color: "success",
    },
  ],
  distance: [
    {
      id: "distance-target",
      label: "Distance target",
      comparison: "gte",
      threshold: 10,
      color: "success",
    },
  ],
  activeMinutes: [
    {
      id: "activity-target",
      label: "Activity target",
      comparison: "gte",
      threshold: 60,
      color: "success",
    },
  ],
  intensityMinutes: [
    {
      id: "intensity-target",
      label: "Weekly intensity target",
      comparison: "gte",
      threshold: 150,
      color: "success",
    },
  ],
  runDistance: [
    {
      id: "running-target",
      label: "Weekly running target",
      comparison: "gte",
      threshold: 50,
      color: "success",
    },
  ],
  bikeDistance: [
    {
      id: "cycling-target",
      label: "Weekly cycling target",
      comparison: "gte",
      threshold: 100,
      color: "success",
    },
  ],
};

const CHART_METRICS: Record<string, Metric> = {
  bodyBattery: "bodyBattery",
  elevation: "altitude",
  heartRate: "heartRate",
  oxygen: "pulseOx",
  pressure: "pressure",
  stress: "stress",
};

const RECIPE_COLORS: Record<
  "default" | "night" | "always-on",
  Record<RuleColor, string>
> = {
  default: {
    caution: "#E5AE38",
    danger: "#E35D66",
    success: "#35AC7B",
    cool: "#53A8FF",
    warm: "#F47C48",
  },
  night: {
    caution: "#73602D",
    danger: "#7A373C",
    success: "#2B6950",
    cool: "#365C7A",
    warm: "#80503A",
  },
  "always-on": {
    caution: "#888888",
    danger: "#AAAAAA",
    success: "#777777",
    cool: "#777777",
    warm: "#999999",
  },
};

export function elementRuleSource(element: FaceElement): Metric | null {
  // These variants display other readings; weather rules evaluate current temperature.
  if (element.type === "weather") {
    const variant = element.presentation?.variant ?? "labeled";
    if (!["labeled", "value", "temperature", "ring", "bar"].includes(variant))
      return null;
  }
  if (isMetric(element.type)) return element.type;
  if (element.type === "complication")
    return element.complication?.source ?? null;
  if (element.type === "progress")
    return element.presentation?.source ?? "steps";
  if (element.type === "chart")
    return CHART_METRICS[element.chart?.source ?? "heartRate"] ?? null;
  return null;
}

function recipeColors(mode: PowerMode) {
  if (mode === "night") return RECIPE_COLORS.night;
  if (mode === "always-on") return RECIPE_COLORS["always-on"];
  return RECIPE_COLORS.default;
}

export function createAppearanceRule(
  source: Metric,
  recolor: boolean,
  mode: PowerMode,
): AppearanceRule {
  const suggestedRule = ruleCandidatesForSource(source, mode)[0]?.rule;
  if (suggestedRule) {
    return {
      ...suggestedRule,
      effect: recolor ? "color" : "hide",
    };
  }

  const lowSource = ["battery", "bodyBattery", "pulseOx"].includes(source);
  return {
    source,
    comparison: lowSource ? "lte" : "gte",
    threshold: METRICS[source].sample,
    effect: recolor ? "color" : "hide",
    color: recipeColors(mode).danger,
  };
}

function materializeRule(
  source: Metric,
  definition: RuleDefinition,
  mode: PowerMode,
): AppearanceRule {
  return {
    source,
    comparison: definition.comparison,
    threshold: definition.threshold,
    ...(definition.target ? { target: definition.target } : {}),
    effect: "color",
    color: recipeColors(mode)[definition.color],
  };
}

export function ruleCandidatesForSource(
  source: Metric,
  mode: PowerMode,
): RuleCandidate[] {
  return (RULE_DEFINITIONS[source] ?? []).map((definition) => ({
    id: definition.id,
    label: definition.label,
    rule: materializeRule(source, definition, mode),
  }));
}

/** Defaults stay ordered from broad warnings to more specific thresholds. */
export function defaultRulesForSource(
  source: Metric,
  mode: PowerMode,
): AppearanceRule[] {
  return (RULE_DEFINITIONS[source] ?? [])
    .filter((definition) => definition.default)
    .map((definition) => materializeRule(source, definition, mode));
}

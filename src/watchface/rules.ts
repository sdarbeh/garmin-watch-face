import { hasUserGoal, type GoalSamples } from "./goals";
import { isMetric, METRICS, type Metric } from "./layer-catalog";
import { supportsMetric, type CapabilityDevice } from "./capabilities";
export const COMPARISONS = {
  lt: "Below",
  lte: "At or below",
  gt: "Above",
  gte: "At or above",
  eq: "Equals",
} as const;
export const MAX_APPEARANCE_RULES = 4;
export interface AppearanceRule {
  source: Metric;
  comparison: keyof typeof COMPARISONS;
  threshold: number;
  target?: "value" | "goal";
  effect: "color" | "hide";
  color: string;
}
export function canRecolor(type: string, variant?: string) {
  return type !== "image" && !["dial", "field-dial"].includes(variant ?? "");
}
export function validateRules(
  value: unknown,
  device: CapabilityDevice,
  recolor: boolean,
): AppearanceRule[] {
  if (!Array.isArray(value) || value.length > MAX_APPEARANCE_RULES)
    throw new Error("Use up to four appearance rules.");
  return value.map((r) => {
    if (
      !r ||
      typeof r !== "object" ||
      Object.keys(r).sort().join() !==
        [
          "source",
          "comparison",
          "threshold",
          "effect",
          "color",
          ...(Object.hasOwn(r, "target") ? ["target"] : []),
        ]
          .sort()
          .join() ||
      (r.target !== undefined && !["value", "goal"].includes(r.target)) ||
      (r.target === "goal" && (!hasUserGoal(r.source) || r.threshold < 0)) ||
      !isMetric(r.source) ||
      !supportsMetric(device, r.source) ||
      !Object.hasOwn(COMPARISONS, r.comparison) ||
      typeof r.threshold !== "number" ||
      !Number.isFinite(r.threshold) ||
      r.threshold < -100 ||
      r.threshold > 999999 ||
      !["color", "hide"].includes(r.effect) ||
      (r.effect === "color" && !recolor) ||
      typeof r.color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(r.color)
    )
      throw new Error("Invalid appearance rule.");
    return {
      ...(r.target !== undefined ? { target: r.target } : {}),
      source: r.source,
      comparison: r.comparison,
      threshold: r.threshold,
      effect: r.effect,
      color: r.color.toUpperCase(),
    };
  });
}

const COMPARISON_PHRASES: Record<AppearanceRule["comparison"], string> = {
  lt: "falls below",
  lte: "is at or below",
  gt: "rises above",
  gte: "is at or above",
  eq: "equals",
};

function ruleThresholdLabel(rule: AppearanceRule) {
  if (rule.target === "goal")
    return `${rule.threshold}% of the user’s daily goal`;
  if (rule.source === "weather") return `${rule.threshold}°C`;
  return `${rule.threshold}${METRICS[rule.source].unit}`;
}

export function ruleSummary(rule: AppearanceRule) {
  const action = rule.effect === "hide" ? "Hide layer" : "Change color";
  return `${action} when ${METRICS[rule.source].label.toLowerCase()} ${COMPARISON_PHRASES[rule.comparison]} ${ruleThresholdLabel(rule)}.`;
}

export function reorderRules(
  rules: AppearanceRule[],
  from: number,
  to: number,
) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= rules.length ||
    to >= rules.length
  )
    return rules;
  const reordered = [...rules];
  const [rule] = reordered.splice(from, 1);
  reordered.splice(to, 0, rule);
  return reordered;
}

interface RuleRange {
  low: number;
  lowInclusive: boolean;
  high: number;
  highInclusive: boolean;
}

function ruleRange(rule: AppearanceRule): RuleRange {
  switch (rule.comparison) {
    case "lt":
      return {
        low: -Infinity,
        lowInclusive: false,
        high: rule.threshold,
        highInclusive: false,
      };
    case "lte":
      return {
        low: -Infinity,
        lowInclusive: false,
        high: rule.threshold,
        highInclusive: true,
      };
    case "gt":
      return {
        low: rule.threshold,
        lowInclusive: false,
        high: Infinity,
        highInclusive: false,
      };
    case "gte":
      return {
        low: rule.threshold,
        lowInclusive: true,
        high: Infinity,
        highInclusive: false,
      };
    case "eq":
      return {
        low: rule.threshold,
        lowInclusive: true,
        high: rule.threshold,
        highInclusive: true,
      };
  }
}

function rangesOverlap(first: RuleRange, second: RuleRange) {
  const low = Math.max(first.low, second.low);
  const high = Math.min(first.high, second.high);
  if (low < high) return true;
  if (low !== high) return false;
  const lowIncluded =
    (low !== first.low || first.lowInclusive) &&
    (low !== second.low || second.lowInclusive);
  const highIncluded =
    (high !== first.high || first.highInclusive) &&
    (high !== second.high || second.highInclusive);
  return lowIncluded && highIncluded;
}

function rangeContains(outer: RuleRange, inner: RuleRange) {
  const containsLow =
    outer.low < inner.low ||
    (outer.low === inner.low && (outer.lowInclusive || !inner.lowInclusive));
  const containsHigh =
    outer.high > inner.high ||
    (outer.high === inner.high &&
      (outer.highInclusive || !inner.highInclusive));
  return containsLow && containsHigh;
}

/** Relationship of the first condition's matching values to the second's. */
export function compareRuleConditions(
  first: AppearanceRule,
  second: AppearanceRule,
) {
  if (
    first.source !== second.source ||
    (first.target ?? "value") !== (second.target ?? "value")
  )
    return "unknown";
  const firstRange = ruleRange(first);
  const secondRange = ruleRange(second);
  if (!rangesOverlap(firstRange, secondRange)) return "disjoint";
  const contains = rangeContains(firstRange, secondRange);
  const within = rangeContains(secondRange, firstRange);
  if (contains && within) return "equal";
  if (contains) return "contains";
  if (within) return "within";
  return "overlap";
}

export interface RuleConflict {
  first: number;
  second: number;
  kind: "duplicate" | "overlap";
}

/** Reports redundant conditions and competing colors whose matching ranges intersect. */
export function ruleConflicts(rules: AppearanceRule[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  rules.forEach((first, firstIndex) => {
    rules.slice(firstIndex + 1).forEach((second, offset) => {
      if (first.source !== second.source) return;
      const secondIndex = firstIndex + offset + 1;
      const sameTarget =
        (first.target ?? "value") === (second.target ?? "value");
      const sameCondition =
        sameTarget &&
        first.comparison === second.comparison &&
        first.threshold === second.threshold;
      if (sameCondition) {
        conflicts.push({
          first: firstIndex,
          second: secondIndex,
          kind: "duplicate",
        });
        return;
      }
      if (
        first.effect !== "color" ||
        second.effect !== "color" ||
        first.color === second.color
      )
        return;
      if (!sameTarget) {
        conflicts.push({
          first: firstIndex,
          second: secondIndex,
          kind: "overlap",
        });
        return;
      }
      const firstRange = ruleRange(first);
      const secondRange = ruleRange(second);
      const intentionalPriority = rangeContains(firstRange, secondRange);
      if (rangesOverlap(firstRange, secondRange) && !intentionalPriority)
        conflicts.push({
          first: firstIndex,
          second: secondIndex,
          kind: "overlap",
        });
    });
  });
  return conflicts;
}
export function matchesRule(
  rule: AppearanceRule,
  value: number,
  goal?: number | null,
) {
  if (!Number.isFinite(value)) return false;
  if (
    rule.target === "goal" &&
    (goal == null || !Number.isFinite(goal) || goal <= 0)
  )
    return false;
  const threshold =
    rule.target === "goal" ? (goal! * rule.threshold) / 100 : rule.threshold;
  switch (rule.comparison) {
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "eq":
      return value === threshold;
  }
}
export function ruleAppearance(
  rules: AppearanceRule[],
  samples: Record<Metric, string> & { goals?: GoalSamples },
  baseColor: string,
) {
  let color = baseColor;
  let visible = true;
  for (const rule of rules)
    if (
      matchesRule(
        rule,
        parseFloat(samples[rule.source]),
        hasUserGoal(rule.source) ? samples.goals?.[rule.source] : undefined,
      )
    ) {
      if (rule.effect === "hide") visible = false;
      else color = rule.color;
    }
  return { color, visible };
}
export function conditionalDraw(
  rules: AppearanceRule[],
  baseColor: string,
  drawing: string,
  baseExpression = `0x${baseColor.slice(1)}`,
) {
  if (!rules.length)
    return drawing.replaceAll(`0x${baseColor.slice(1)}`, baseExpression);
  const operators = { lt: "<", lte: "<=", gt: ">", gte: ">=", eq: "==" };
  const condition = (r: AppearanceRule) => {
    const goal = `${r.source}Goal`;
    const threshold =
      r.target === "goal"
        ? `(${goal}.toFloat() * ${r.threshold} / 100.0)`
        : r.threshold;
    const guard =
      r.target === "goal" ? `${goal} != null && ${goal} > 0 && ` : "";
    return `${guard}${r.source} != null && ${r.source} ${operators[r.comparison]} ${threshold}`;
  };
  const colors = rules.filter((r) => r.effect === "color");
  const hides = rules.filter((r) => r.effect === "hide");
  const lines = colors
    .map((r) => `if (${condition(r)}) { ruleColor = 0x${r.color.slice(1)}; }`)
    .join("\n");
  const visible = hides.map((r) => `!(${condition(r)})`).join(" && ") || "true";
  const content = colors.length
    ? drawing.replaceAll(`0x${baseColor.slice(1)}`, "ruleColor")
    : drawing.replaceAll(`0x${baseColor.slice(1)}`, baseExpression);
  return `if (${visible}) { ${colors.length ? `var ruleColor = ${baseExpression}; ${lines}` : ""}\n${content}\n}`;
}

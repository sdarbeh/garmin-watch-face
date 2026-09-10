import { hasUserGoal, type GoalSamples } from "./goals";
import { isMetric, type Metric } from "./layer-catalog";
import { supportsMetric, type CapabilityDevice } from "./capabilities";
export const COMPARISONS = {
  lt: "Below",
  lte: "At or below",
  gt: "Above",
  gte: "At or above",
  eq: "Equals",
} as const;
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
  if (!Array.isArray(value) || value.length > 4)
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

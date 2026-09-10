import type { AppearanceRule } from "./rules";
import type { Metric } from "./layer-catalog";
/** Ordinary editable rules, ordered so the strongest matching color wins. */
export function defaultMetricRules(
  source: string,
  night = false,
): AppearanceRule[] {
  const colors = night
    ? { caution: "#73602D", low: "#7A373C", goal: "#2B6950" }
    : { caution: "#E5AE38", low: "#E35D66", goal: "#35AC7B" };
  const rule = (
    comparison: AppearanceRule["comparison"],
    threshold: number,
    color: string,
  ): AppearanceRule => ({
    source: source as Metric,
    comparison,
    threshold,
    color,
    effect: "color",
  });
  switch (source) {
    case "battery":
      return [rule("lte", 20, colors.caution), rule("lte", 10, colors.low)];
    case "stress":
      return [rule("gte", 51, colors.caution), rule("gte", 76, colors.low)];
    case "bodyBattery":
      return [rule("lte", 50, colors.caution), rule("lte", 25, colors.low)];
    case "steps":
    case "floors":
      return [{ ...rule("gte", 100, colors.goal), target: "goal" }];
    case "recovery":
      return [rule("eq", 0, colors.goal)];
    default:
      return [];
  }
}

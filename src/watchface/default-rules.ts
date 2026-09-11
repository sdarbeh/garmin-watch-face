import type { AppearanceRule } from "./rules";
import { isMetric } from "./layer-catalog";
import { defaultRulesForSource } from "./rule-recipes";
/** Ordinary editable rules, ordered so the strongest matching color wins. */
export function defaultMetricRules(
  source: string,
  night = false,
): AppearanceRule[] {
  if (!isMetric(source)) return [];
  return defaultRulesForSource(source, night ? "night" : "normal");
}

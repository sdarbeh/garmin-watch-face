import {
  supportsMetric,
  supportsMode,
  type CapabilityDevice,
} from "./capabilities";
import type { PowerMode } from "./power";
import type { FaceElement } from "./schema";
import {
  elementRuleSource,
  ruleCandidatesForSource,
  type RuleCandidate,
} from "./rule-recipes";
import {
  canRecolor,
  compareRuleConditions,
  MAX_APPEARANCE_RULES,
  type AppearanceRule,
} from "./rules";

export interface RuleSuggestion extends RuleCandidate {
  insertAt: number;
}

function direction(rule: AppearanceRule) {
  if (rule.comparison === "lt" || rule.comparison === "lte") return "below";
  if (rule.comparison === "gt" || rule.comparison === "gte") return "above";
  return "equal";
}

/** Match configured intent without treating custom colors or thresholds as missing defaults. */
function configuredCandidates(
  candidates: RuleCandidate[],
  rules: AppearanceRule[],
) {
  const matches = rules
    .flatMap((rule, ruleIndex) =>
      candidates.flatMap((candidate, candidateIndex) => {
        const expected = candidate.rule;
        if (
          rule.effect !== expected.effect ||
          rule.source !== expected.source ||
          (rule.target ?? "value") !== (expected.target ?? "value") ||
          direction(rule) !== direction(expected)
        )
          return [];
        return [
          {
            ruleIndex,
            candidateIndex,
            distance: Math.abs(rule.threshold - expected.threshold),
          },
        ];
      }),
    )
    .sort((a, b) => a.distance - b.distance);

  // Closest thresholds match first; each existing rule accounts for only one intent.
  const configured = new Set<number>();
  const matchedRules = new Set<number>();
  for (const match of matches) {
    if (
      configured.has(match.candidateIndex) ||
      matchedRules.has(match.ruleIndex)
    )
      continue;
    configured.add(match.candidateIndex);
    matchedRules.add(match.ruleIndex);
  }
  return configured;
}

/** Find a safe slot without reordering or rewriting any existing rules. */
export function suggestionInsertionIndex(
  rules: AppearanceRule[],
  candidate: AppearanceRule,
): number | null {
  let earliest = 0;
  let latest = rules.length;
  for (const [index, existing] of rules.entries()) {
    const relation = compareRuleConditions(candidate, existing);
    if (existing.effect === "hide") {
      // A color change is useless when its whole range is already hidden.
      if (relation === "within" || relation === "equal") return null;
      continue;
    }
    if (relation === "disjoint") continue;
    if (
      relation === "equal" ||
      relation === "overlap" ||
      relation === "unknown"
    )
      return null;
    if (relation === "within") earliest = Math.max(earliest, index + 1);
    if (relation === "contains") latest = Math.min(latest, index);
  }
  // Conflicting custom priorities require the user to decide, not an automatic reorder.
  return earliest <= latest ? latest : null;
}

export function ruleSuggestionsFor(
  element: FaceElement,
  device: CapabilityDevice,
  mode: PowerMode,
): RuleSuggestion[] {
  const rules = element.rules ?? [];
  const source = elementRuleSource(element);
  if (
    !source ||
    rules.length >= MAX_APPEARANCE_RULES ||
    !supportsMetric(device, source) ||
    !supportsMode(device, mode) ||
    !canRecolor(element.type, element.presentation?.variant)
  )
    return [];

  const candidates = ruleCandidatesForSource(source, mode);
  const configured = configuredCandidates(candidates, rules);
  return candidates.flatMap((candidate, index) => {
    if (configured.has(index)) return [];
    const insertAt = suggestionInsertionIndex(rules, candidate.rule);
    return insertAt === null ? [] : [{ ...candidate, insertAt }];
  });
}

/** Re-evaluate on click so a stale suggestion cannot overwrite edits or exceed the limit. */
export function addRuleSuggestion(
  element: FaceElement,
  device: CapabilityDevice,
  mode: PowerMode,
  id: string,
) {
  const suggestion = ruleSuggestionsFor(element, device, mode).find(
    (item) => item.id === id,
  );
  if (!suggestion) return null;
  const rules = [...(element.rules ?? [])];
  rules.splice(suggestion.insertAt, 0, { ...suggestion.rule });
  return { rules, index: suggestion.insertAt };
}

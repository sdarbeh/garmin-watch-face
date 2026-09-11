import { Button, ColorField } from "@/components/ui";
import type { Ref } from "react";
import { DeleteIcon } from "@/icons";
import { hasUserGoal } from "@/watchface/goals";
import { METRICS, type Metric } from "@/watchface/layer-catalog";
import type { PowerMode } from "@/watchface/power";
import { createAppearanceRule } from "@/watchface/rule-recipes";
import {
  COMPARISONS,
  ruleSummary,
  type AppearanceRule,
} from "@/watchface/rules";
import type { Simulation } from "../model/simulation";
import { InspectorSection } from "./InspectorSection";
import { RuleGoalPreview } from "./RuleGoalPreview";

function ruleUnit(source: Metric) {
  if (source === "weather") return "Celsius";
  if (source === "distance") return "kilometers";
  return METRICS[source].label.toLowerCase();
}

export function AppearanceRuleEditor({
  rule,
  index,
  rules,
  sources,
  recolor,
  mode,
  disabled,
  simulation,
  open,
  summaryRef,
  onRulesChange,
  onOpenChange,
  onMove,
  onRemove,
  onSimulationChange,
}: {
  rule: AppearanceRule;
  index: number;
  rules: AppearanceRule[];
  sources: Metric[];
  recolor: boolean;
  mode: PowerMode;
  disabled: boolean;
  simulation: Simulation;
  open: boolean;
  summaryRef: Ref<HTMLButtonElement>;
  onRulesChange: (rules: AppearanceRule[]) => void;
  onOpenChange: (open: boolean) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
  onSimulationChange: (value: Simulation) => void;
}) {
  const update = (patch: Partial<AppearanceRule>) =>
    onRulesChange(
      rules.map((item, ruleIndex) =>
        ruleIndex === index ? { ...item, ...patch } : item,
      ),
    );

  return (
    <InspectorSection
      summaryRef={summaryRef}
      className="watchface-rule-section"
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="watchface-rule-title">
          <span className="watchface-rule-title__number">Rule {index + 1}</span>
          <span className="watchface-rule-title__summary">
            {ruleSummary(rule)}
          </span>
        </span>
      }
    >
      <fieldset
        className="watchface-rule ui-field"
        disabled={disabled}
        aria-label={`Rule ${index + 1}`}
      >
        <div className="watchface-rule-order mb2">
          <span className="u-font-xs u-text-secondary">
            Order {index + 1} of {rules.length}
          </span>
          <div>
            <Button
              size="xs"
              variant="ghost"
              disabled={disabled || index === 0}
              aria-label={`Move rule ${index + 1} earlier`}
              onClick={() => onMove(index - 1)}
            >
              Earlier
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={disabled || index === rules.length - 1}
              aria-label={`Move rule ${index + 1} later`}
              onClick={() => onMove(index + 1)}
            >
              Later
            </Button>
          </div>
        </div>
        <label className="watchface-property-row">
          When
          <select
            value={rule.source}
            onChange={(event) => {
              const source = event.target.value as Metric;
              const defaults = createAppearanceRule(source, recolor, mode);
              update({
                source,
                comparison: defaults.comparison,
                threshold: defaults.threshold,
                target: defaults.target ?? "value",
              });
            }}
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {METRICS[source].label}
              </option>
            ))}
          </select>
        </label>
        <label className="watchface-property-row">
          Comparison
          <select
            value={rule.comparison}
            onChange={(event) =>
              update({
                comparison: event.target.value as AppearanceRule["comparison"],
              })
            }
          >
            {Object.entries(COMPARISONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {hasUserGoal(rule.source) && (
          <label className="watchface-property-row">
            Compare to
            <select
              value={rule.target ?? "value"}
              onChange={(event) =>
                update({
                  target: event.target.value as "value" | "goal",
                  threshold:
                    event.target.value === "goal"
                      ? 100
                      : METRICS[rule.source].goal,
                })
              }
            >
              <option value="value">Fixed value</option>
              <option value="goal">User’s daily goal</option>
            </select>
          </label>
        )}
        <label className="watchface-property-row">
          {rule.target === "goal" ? "Goal percentage" : "Threshold"}
          <input
            type="number"
            step="any"
            min={rule.target === "goal" ? 0 : -100}
            max={999999}
            value={rule.threshold}
            onChange={(event) => {
              const threshold = event.target.valueAsNumber;
              const minimum = rule.target === "goal" ? 0 : -100;
              if (
                Number.isFinite(threshold) &&
                threshold >= minimum &&
                threshold <= 999999
              )
                update({ threshold });
            }}
          />
        </label>
        <label className="watchface-property-row">
          Then
          <select
            value={rule.effect}
            onChange={(event) =>
              update({ effect: event.target.value as AppearanceRule["effect"] })
            }
          >
            {recolor && <option value="color">Change color</option>}
            <option value="hide">Hide layer</option>
          </select>
        </label>
        {rule.effect === "color" && (
          <div className="watchface-property-row">
            <span>Color</span>
            <ColorField
              label="Rule color"
              value={rule.color}
              disabled={disabled}
              onChange={(color) => update({ color })}
            />
          </div>
        )}
        <label className="watchface-property-row">
          Preview value
          <input
            type="number"
            step="any"
            min={-100}
            max={999999}
            value={simulation[rule.source]}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value) && value >= -100 && value <= 999999)
                onSimulationChange({ ...simulation, [rule.source]: value });
            }}
          />
        </label>
        {rule.target === "goal" && hasUserGoal(rule.source) && (
          <RuleGoalPreview
            source={rule.source}
            simulation={simulation}
            onChange={onSimulationChange}
          />
        )}
        <p className="u-font-xs u-text-secondary mb2">
          Values use {ruleUnit(rule.source)}. Preview changes are not saved.
        </p>
        <Button
          size="sm"
          variant="danger"
          iconOnly
          aria-label={`Remove rule ${index + 1}`}
          title="Remove rule"
          disabled={disabled}
          onClick={onRemove}
        >
          <DeleteIcon size="sm" />
        </Button>
      </fieldset>
    </InspectorSection>
  );
}

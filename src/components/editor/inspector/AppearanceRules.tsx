import { hasUserGoal } from "@/watchface/goals";
import { RuleGoalPreview } from "./RuleGoalPreview";
import { DeleteIcon } from "@/icons";
import { InspectorSection } from "./InspectorSection";
import { Button, ColorField } from "@/components/ui";
import { METRICS } from "@/watchface/layer-catalog";
import {
  supportedMetrics,
  type CapabilityDevice,
} from "@/watchface/capabilities";
import {
  COMPARISONS,
  canRecolor,
  type AppearanceRule,
} from "@/watchface/rules";
import { presentation, type FaceElement } from "@/watchface/schema";
import type { Simulation } from "../model/simulation";
export function AppearanceRules({
  element,
  device,
  disabled,
  onChange,
  simulation,
  onSimulationChange,
}: {
  element: FaceElement;
  device: CapabilityDevice;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
  simulation: Simulation;
  onSimulationChange: (value: Simulation) => void;
}) {
  const rules = element.rules ?? [];
  const recolor = canRecolor(element.type, presentation(element).variant);
  const update = (index: number, patch: Partial<AppearanceRule>) =>
    onChange({
      rules: rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  return (
    <InspectorSection
      title={`Rules${rules.length ? ` (${rules.length})` : ""}`}
    >
      <p className="u-font-xs u-text-secondary mb3">
        Change this layer based on watch data. Matching hide rules take
        priority; the last matching color wins. Missing data leaves the base
        appearance unchanged.
      </p>
      {rules.map((rule, index) => (
        <InspectorSection
          key={index}
          defaultOpen
          title={`${METRICS[rule.source].label} ${COMPARISONS[rule.comparison].toLowerCase()} ${rule.threshold}${rule.target === "goal" ? "% of daily goal" : ""} → ${rule.effect === "hide" ? "Hide layer" : "Change color"}`}
        >
          <fieldset
            className="watchface-rule ui-field"
            disabled={disabled}
            aria-label={`Rule ${index + 1}`}
          >
            <label className="watchface-property-row u-font-xs mb2">
              When
              <select
                value={rule.source}
                onChange={(e) =>
                  update(index, {
                    source: e.target.value as AppearanceRule["source"],
                    target: "value",
                  })
                }
              >
                {supportedMetrics(device).map((source) => (
                  <option key={source} value={source}>
                    {METRICS[source].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="watchface-property-row u-font-xs mb2">
              Comparison
              <select
                value={rule.comparison}
                onChange={(e) =>
                  update(index, {
                    comparison: e.target.value as AppearanceRule["comparison"],
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
              <label className="watchface-property-row u-font-xs mb2">
                Compare to
                <select
                  value={rule.target ?? "value"}
                  onChange={(e) =>
                    update(index, {
                      target: e.target.value as "value" | "goal",
                      threshold:
                        e.target.value === "goal"
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
            <label className="watchface-property-row u-font-xs mb2">
              {rule.target === "goal" ? "Goal percentage" : "Threshold"}
              <input
                type="number"
                step="any"
                min={rule.target === "goal" ? 0 : -100}
                max={999999}
                value={rule.threshold}
                onChange={(e) => {
                  const threshold = e.target.valueAsNumber;
                  if (
                    Number.isFinite(threshold) &&
                    threshold >= (rule.target === "goal" ? 0 : -100) &&
                    threshold <= 999999
                  )
                    update(index, { threshold });
                }}
              />
            </label>
            <label className="watchface-property-row u-font-xs mb2">
              Then
              <select
                value={rule.effect}
                onChange={(e) =>
                  update(index, {
                    effect: e.target.value as AppearanceRule["effect"],
                  })
                }
              >
                {recolor && <option value="color">Change color</option>}
                <option value="hide">Hide layer</option>
              </select>
            </label>
            {rule.effect === "color" && (
              <ColorField
                label="Rule color"
                value={rule.color}
                disabled={disabled}
                onChange={(color) => update(index, { color })}
              />
            )}
            <label className="watchface-property-row u-font-xs mb2">
              Preview value
              <input
                type="number"
                step="any"
                min={-100}
                max={999999}
                value={simulation[rule.source]}
                onChange={(e) => {
                  const value = e.target.valueAsNumber;
                  if (
                    Number.isFinite(value) &&
                    value >= -100 &&
                    value <= 999999
                  )
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
              Values use{" "}
              {(
                { weather: "Celsius", distance: "kilometers" } as Record<
                  string,
                  string
                >
              )[rule.source] ?? METRICS[rule.source].label.toLowerCase()}
              . Preview changes are not saved.
            </p>
            <Button
              size="sm"
              variant="danger"
              iconOnly
              aria-label={`Remove rule ${index + 1}`}
              title="Remove rule"
              disabled={disabled}
              onClick={() =>
                onChange({ rules: rules.filter((_, i) => i !== index) })
              }
            >
              <DeleteIcon size="sm" />
            </Button>
          </fieldset>
        </InspectorSection>
      ))}
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled || rules.length >= 4}
        onClick={() =>
          onChange({
            rules: [
              ...rules,
              {
                source: "battery",
                comparison: "lt",
                threshold: 20,
                effect: recolor ? "color" : "hide",
                color: "#FF4444",
              },
            ],
          })
        }
      >
        Add rule
      </Button>
    </InspectorSection>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { isMetric, type Metric } from "@/watchface/layer-catalog";
import type { ElementType } from "@/watchface/schema";
import { LAYER_LABELS } from "@/components/editor/types";
import {
  shiftDate,
  shiftTime,
  type DisplayMode,
  type Simulation,
} from "@/components/editor/model/simulation";
import {
  clampSimulationNumber,
  isSimulationDateValid,
  METRIC_SIMULATION_CONSTRAINTS,
  SIMULATION_DATE_MAX,
  SIMULATION_DATE_MIN,
} from "@/components/editor/model/simulation-constraints";
import { SimulationNumberInput } from "./SimulationNumberInput";

export function SimulationControl({
  type,
  values,
  onChange,
  disabled,
  mode,
}: {
  type: ElementType | Metric | "background";
  values: Simulation;
  onChange: (values: Simulation) => void;
  disabled: boolean;
  mode: DisplayMode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (type === "chart")
    return (
      <label className="ui-field u-font-xs">
        Preview history
        <select
          disabled={disabled}
          value={values.chartPreview}
          onChange={(e) =>
            onChange({
              ...values,
              chartPreview: e.target.value as Simulation["chartPreview"],
            })
          }
        >
          <option value="typical">Typical readings</option>
          <option value="gaps">Missing readings</option>
          <option value="empty">No data</option>
        </select>
      </label>
    );
  if (type !== "time" && type !== "date" && !isMetric(type))
    return (
      <span className="u-font-xs u-text-secondary">
        Select a data layer to simulate
      </span>
    );
  const batteryOverride = type === "battery" && mode === "low-battery";
  const inactive = disabled || batteryOverride;
  const shown = batteryOverride ? 5 : values[type];
  const numeric = isMetric(type);
  function updateTemporalValue(value: string) {
    setDraft(value);
    if (type === "time") {
      if (/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
        onChange({ ...values, time: value });
      }
      return;
    }
    if (type === "date" && isSimulationDateValid(value)) {
      onChange({ ...values, date: value });
    }
  }

  function step(direction: number) {
    setDraft(null);
    if (type === "time") {
      onChange({ ...values, time: shiftTime(values.time, direction * 15) });
      return;
    }
    if (type === "date") {
      const date = shiftDate(values.date, direction);
      if (isSimulationDateValid(date)) onChange({ ...values, date });
      return;
    }
    if (isMetric(type)) {
      const constraint = METRIC_SIMULATION_CONSTRAINTS[type];
      onChange({
        ...values,
        [type]: clampSimulationNumber(
          values[type] + direction * constraint.step,
          constraint,
        ),
      });
    }
  }
  return (
    <>
      <label htmlFor="sample-value" className="u-font-xs u-text-secondary">
        Simulate {LAYER_LABELS[type].toLowerCase()}
      </label>
      <div
        className="watchface-footer__value"
        title={
          batteryOverride ? "Low battery mode uses a 5% sample" : undefined
        }
      >
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={`Decrease sample ${type}`}
          disabled={inactive}
          onClick={() => step(-1)}
        >
          <ChevronLeftIcon size="sm" />
        </Button>
        {numeric ? (
          <SimulationNumberInput
            key={type}
            id="sample-value"
            label={`Simulate ${LAYER_LABELS[type].toLowerCase()}`}
            value={shown as number}
            constraint={METRIC_SIMULATION_CONSTRAINTS[type]}
            disabled={inactive}
            onChange={(value) => onChange({ ...values, [type]: value })}
          />
        ) : (
          <input
            id="sample-value"
            type={type}
            min={type === "date" ? SIMULATION_DATE_MIN : undefined}
            max={type === "date" ? SIMULATION_DATE_MAX : undefined}
            value={draft ?? shown}
            disabled={inactive}
            onChange={(event) => updateTemporalValue(event.target.value)}
            onBlur={() => setDraft(null)}
          />
        )}
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={`Increase sample ${type}`}
          disabled={inactive}
          onClick={() => step(1)}
        >
          <ChevronRightIcon size="sm" />
        </Button>
      </div>
    </>
  );
}

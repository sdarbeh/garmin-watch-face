import type { Metric } from "@/watchface/layer-catalog";
import { isMetric } from "@/watchface/layer-catalog";
import { useState } from "react";
import { Button } from "@/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { LAYER_LABELS } from "./types";
import {
  shiftDate,
  shiftTime,
  type DisplayMode,
  type Simulation,
} from "./model/simulation";
import type { ElementType } from "@/watchface/schema";

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
  const min = type === "weather" ? -100 : 0;
  const max = type === "battery" ? 100 : 999999;
  function update(value: string) {
    setDraft(value);
    if (
      type === "time" &&
      !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
    )
      return;
    if (
      type === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
    )
      return;
    if (
      numeric &&
      (!/^-?\d+(\.\d+)?$/.test(value) ||
        Number(value) > max ||
        Number(value) < min)
    )
      return;
    onChange({ ...values, [type]: numeric ? Number(value) : value });
  }
  function step(direction: number) {
    setDraft(null);
    if (type === "time")
      onChange({ ...values, time: shiftTime(values.time, direction * 15) });
    else if (type === "date")
      onChange({ ...values, date: shiftDate(values.date, direction) });
    else if (isMetric(type))
      onChange({
        ...values,
        [type]: Math.max(
          min,
          Math.min(
            max,
            values[type] + direction * (type === "steps" ? 100 : 1),
          ),
        ),
      });
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
        <input
          id="sample-value"
          type={numeric ? "number" : type}
          min={numeric ? min : undefined}
          max={numeric ? max : undefined}
          step={numeric ? 1 : undefined}
          value={batteryOverride ? shown : (draft ?? shown)}
          disabled={inactive}
          onChange={(event) => update(event.target.value)}
          onBlur={() => setDraft(null)}
        />
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

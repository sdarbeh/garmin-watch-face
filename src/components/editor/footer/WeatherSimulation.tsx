import { WEATHER_CONDITIONS } from "@/watchface/weather";
import type { Simulation } from "@/components/editor/model/simulation";
import { WEATHER_SIMULATION_CONSTRAINTS } from "@/components/editor/model/simulation-constraints";
import { SimulationNumberInput } from "./SimulationNumberInput";

export function WeatherSimulation({
  variant,
  values,
  onChange,
  disabled,
}: {
  variant: string;
  values: Simulation;
  onChange: (values: Simulation) => void;
  disabled: boolean;
}) {
  if (variant === "condition-icon")
    return (
      <label className="ui-field u-font-xs">
        Preview condition
        <select
          disabled={disabled}
          value={values.weatherCondition}
          onChange={(e) =>
            onChange({ ...values, weatherCondition: Number(e.target.value) })
          }
        >
          {WEATHER_CONDITIONS.map((c) => (
            <option key={c.label} value={c.codes[0]}>
              {c.label}
            </option>
          ))}
          <option value={-1}>Unavailable</option>
        </select>
      </label>
    );
  const field =
    WEATHER_SIMULATION_CONSTRAINTS[
      variant as keyof typeof WEATHER_SIMULATION_CONSTRAINTS
    ];
  if (!field) return null;
  const { key, label, ...constraint } = field;
  return (
    <label className="ui-field u-font-xs">
      {label}
      <SimulationNumberInput
        key={key}
        id="weather-sample"
        label={`Simulate ${label.toLowerCase()}`}
        disabled={disabled}
        value={values[key]}
        constraint={constraint}
        onChange={(value) => onChange({ ...values, [key]: value })}
      />
    </label>
  );
}
export const hasWeatherSimulation = (variant: string) =>
  variant === "condition-icon" || variant in WEATHER_SIMULATION_CONSTRAINTS;

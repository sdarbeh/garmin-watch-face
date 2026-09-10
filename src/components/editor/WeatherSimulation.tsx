import { WEATHER_CONDITIONS } from "@/watchface/weather";
import type { Simulation } from "./model/simulation";
const fields = {
  high: ["weatherHigh", "High (C)", -100, 100],
  low: ["weatherLow", "Low (C)", -100, 100],
  "feels-like": ["weatherFeelsLike", "Feels like (C)", -100, 100],
  humidity: ["weatherHumidity", "Humidity (%)", 0, 100],
  wind: ["weatherWind", "Wind (m/s)", 0, 150],
} as const;
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
  const field = fields[variant as keyof typeof fields];
  if (!field) return null;
  const [key, label, min, max] = field;
  return (
    <label className="ui-field u-font-xs">
      {label}
      <input
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        step="0.1"
        value={values[key]}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n) && n >= min && n <= max)
            onChange({ ...values, [key]: n });
        }}
      />
    </label>
  );
}
export const hasWeatherSimulation = (variant: string) =>
  variant === "condition-icon" || variant in fields;

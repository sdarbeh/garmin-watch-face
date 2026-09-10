import { METRICS, type Metric } from "./layer-catalog";
export interface ValueFormat {
  units: "metric" | "imperial";
  decimals: number;
  prefix: string;
  suffix: string;
}
export function defaultFormat(type: Metric): ValueFormat {
  return {
    units: "metric",
    decimals: type === "distance" ? 1 : 0,
    prefix: "",
    suffix: "",
  };
}
export const WEATHER_VALUES = {
  temperature: { field: "temperature", sample: 22, unit: " C" },
  high: { field: "highTemperature", sample: 26, unit: " C" },
  low: { field: "lowTemperature", sample: 18, unit: " C" },
  "feels-like": { field: "feelsLikeTemperature", sample: 21, unit: " C" },
  humidity: { field: "relativeHumidity", sample: 64, unit: "%" },
  wind: { field: "windSpeed", sample: 3.5, unit: " km/h" },
} as const;
export type WeatherValue = keyof typeof WEATHER_VALUES;
export function weatherValue(variant: string) {
  return WEATHER_VALUES[variant as WeatherValue];
}
export function conversion(type: string, variant: string, imperial: boolean) {
  if (["distance", "runDistance", "bikeDistance"].includes(type))
    return {
      scale: imperial ? 0.621371 : 1,
      offset: 0,
      unit: imperial ? " mi" : " km",
    };
  if (type === "altitude")
    return {
      scale: imperial ? 3.28084 : 1,
      offset: 0,
      unit: imperial ? " ft" : " m",
    };
  if (type === "pressure")
    return {
      scale: imperial ? 0.02953 : 1,
      offset: 0,
      unit: imperial ? " inHg" : " hPa",
    };
  if (type === "weather") {
    if (variant === "humidity") return { scale: 1, offset: 0, unit: "%" };
    if (variant === "wind")
      return {
        scale: imperial ? 2.236936 : 3.6,
        offset: 0,
        unit: imperial ? " mph" : " km/h",
      };
    return {
      scale: imperial ? 1.8 : 1,
      offset: imperial ? 32 : 0,
      unit: imperial ? " F" : " C",
    };
  }
  return { scale: 1, offset: 0, unit: METRICS[type as Metric]?.unit ?? "" };
}
export function formattedValue(
  value: number,
  type: Metric,
  variant: string,
  format: ValueFormat,
) {
  if (!Number.isFinite(value)) return "--";
  const c = conversion(type, variant, format.units === "imperial");
  const unit = metricUnit(type, variant, c.unit);
  return (
    format.prefix +
    (value * c.scale + c.offset).toFixed(format.decimals) +
    (format.suffix || unit)
  );
}

export function metricUnit(type: string, variant: string, unit: string) {
  if (variant === "value") return "";
  if (type === "battery" && variant === "percentage") return "%";
  return unit;
}

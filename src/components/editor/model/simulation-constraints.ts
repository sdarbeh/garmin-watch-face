import type { Metric } from "@/watchface/layer-catalog";

export interface SimulationNumberConstraint {
  min: number;
  max: number;
  step: number;
}

export const SIMULATION_DATE_MIN = "2000-01-01";
export const SIMULATION_DATE_MAX = "2099-12-31";

export function isSimulationDateValid(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= SIMULATION_DATE_MIN &&
    value <= SIMULATION_DATE_MAX
  );
}

export const METRIC_SIMULATION_CONSTRAINTS = {
  activeMinutes: { min: 0, max: 1440, step: 1 },
  altitude: { min: -500, max: 10000, step: 1 },
  battery: { min: 0, max: 100, step: 1 },
  bikeDistance: { min: 0, max: 10000, step: 0.1 },
  bodyBattery: { min: 0, max: 100, step: 1 },
  calories: { min: 0, max: 50000, step: 1 },
  distance: { min: 0, max: 1000, step: 0.1 },
  floors: { min: 0, max: 1000, step: 1 },
  heartRate: { min: 20, max: 254, step: 1 },
  intensityMinutes: { min: 0, max: 10080, step: 1 },
  notifications: { min: 0, max: 999, step: 1 },
  pressure: { min: 300, max: 1100, step: 1 },
  pulseOx: { min: 0, max: 100, step: 1 },
  race10k: { min: 60, max: 172800, step: 1 },
  race5k: { min: 60, max: 172800, step: 1 },
  raceHalf: { min: 60, max: 172800, step: 1 },
  raceMarathon: { min: 60, max: 172800, step: 1 },
  recovery: { min: 0, max: 168, step: 1 },
  respiration: { min: 0, max: 100, step: 0.1 },
  runDistance: { min: 0, max: 10000, step: 0.1 },
  steps: { min: 0, max: 200000, step: 100 },
  stress: { min: 0, max: 100, step: 1 },
  vo2Bike: { min: 0, max: 100, step: 1 },
  vo2Run: { min: 0, max: 100, step: 1 },
  weather: { min: -100, max: 100, step: 0.1 },
} satisfies Record<Metric, SimulationNumberConstraint>;

export const WEATHER_SIMULATION_CONSTRAINTS = {
  "feels-like": {
    key: "weatherFeelsLike",
    label: "Feels like (C)",
    min: -100,
    max: 100,
    step: 0.1,
  },
  high: {
    key: "weatherHigh",
    label: "High (C)",
    min: -100,
    max: 100,
    step: 0.1,
  },
  humidity: {
    key: "weatherHumidity",
    label: "Humidity (%)",
    min: 0,
    max: 100,
    step: 1,
  },
  low: {
    key: "weatherLow",
    label: "Low (C)",
    min: -100,
    max: 100,
    step: 0.1,
  },
  wind: {
    key: "weatherWind",
    label: "Wind (m/s)",
    min: 0,
    max: 150,
    step: 0.1,
  },
} as const;

export function isSimulationNumberValid(
  value: number,
  constraint: SimulationNumberConstraint,
) {
  const steps = (value - constraint.min) / constraint.step;
  return (
    Number.isFinite(value) &&
    value >= constraint.min &&
    value <= constraint.max &&
    Math.abs(steps - Math.round(steps)) < 1e-8
  );
}

export function clampSimulationNumber(
  value: number,
  constraint: SimulationNumberConstraint,
) {
  const clamped = Math.max(constraint.min, Math.min(constraint.max, value));
  const steps = Math.round((clamped - constraint.min) / constraint.step);
  return Number((constraint.min + steps * constraint.step).toFixed(8));
}

import type { StatusSource } from "../../../watchface/status-sources";
import { SAMPLE_GOALS, type GoalSamples } from "../../../watchface/goals";
import type { ComplicationSamples } from "@/watchface/complications";
import type { ChartPreview } from "@/watchface/charts";
import { METRICS, type Metric } from "../../../watchface/layer-catalog";
import { SAMPLE_DATA } from "../../../watchface/render-model";
export type { PowerMode as DisplayMode } from "../../../watchface/power";
import type { PowerMode as DisplayMode } from "../../../watchface/power";
export type Simulation = Record<Metric, number> & {
  weatherCondition: number;
  weatherHumidity: number;
  weatherWind: number;
  weatherFeelsLike: number;
  weatherHigh: number;
  weatherLow: number;
  chartPreview: ChartPreview;
  goals?: GoalSamples;
  statusValues?: Partial<Record<StatusSource, string>>;
  complicationValues?: ComplicationSamples;
  dnd?: boolean;
  time: string;
  date: string;
  steps: number;
  battery: number;
};
export const DEFAULT_SIMULATION: Simulation = {
  ...(Object.fromEntries(
    Object.entries(METRICS).map(([key, value]) => [key, value.sample]),
  ) as Record<Metric, number>),
  chartPreview: "typical",
  goals: SAMPLE_GOALS,
  weatherCondition: 1,
  weatherHumidity: 64,
  weatherWind: 3.5,
  weatherFeelsLike: 21,
  weatherHigh: 26,
  weatherLow: 18,
  time: "13:09",
  date: "2026-09-08",
  steps: 6248,
  battery: 82,
};
/** Read local calendar fields so the default matches the user's device timezone. */
export function createDefaultSimulation(now = new Date()): Simulation {
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    ...DEFAULT_SIMULATION,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  };
}
export function shiftTime(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const seconds = time.split(":")[2];
  const total = (((hour * 60 + minute + minutes) % 1440) + 1440) % 1440;
  return `${Math.floor(total / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:${(total % 60).toString().padStart(2, "0")}${seconds === undefined ? "" : `:${seconds}`}`;
}
export function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
export function simulationValues(values: Simulation, mode: DisplayMode) {
  const date = new Date(`${values.date}T12:00:00Z`);
  const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
    date.getUTCDay()
  ];
  const month = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ][date.getUTCMonth()];
  return {
    ...SAMPLE_DATA,
    ...Object.fromEntries(
      Object.entries(METRICS).map(([key, metric]) => [
        key,
        `${values[key as Metric]}${metric.unit}`,
      ]),
    ),
    ...Object.fromEntries(
      [
        "weatherCondition",
        "weatherHumidity",
        "weatherWind",
        "weatherFeelsLike",
        "weatherHigh",
        "weatherLow",
      ].map((key) => [key, String(values[key as keyof Simulation])]),
    ),
    chartPreview: values.chartPreview,
    goals: values.goals,
    statusValues: values.statusValues,
    complicationValues: values.complicationValues,
    time: values.time,
    date: `${weekday} ${date.getUTCDate()} ${month}`,
    dateFull: `${weekday} ${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`,
    steps: `${values.steps} steps`,
    battery: `${mode === "low-battery" ? 5 : values.battery}% battery`,
  };
}

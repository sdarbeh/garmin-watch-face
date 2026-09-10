import { STATUS_SOURCES } from "./status-sources";
/** Data bindings and presentation choices shared by the editor and compiler. */
export const METRICS = {
  intensityMinutes: {
    label: "Weekly intensity minutes",
    unit: " min",
    sample: 186,
    goal: 150,
  },
  runDistance: {
    label: "Weekly running distance",
    unit: " km",
    sample: 26.4,
    goal: 50,
  },
  bikeDistance: {
    label: "Weekly cycling distance",
    unit: " km",
    sample: 78.5,
    goal: 100,
  },
  vo2Run: { label: "Running VO2 max", unit: "", sample: 54, goal: 100 },
  vo2Bike: { label: "Cycling VO2 max", unit: "", sample: 52, goal: 100 },
  pulseOx: { label: "Pulse Ox", unit: "%", sample: 98, goal: 100 },
  respiration: { label: "Respiration", unit: " brpm", sample: 16, goal: 30 },
  notifications: { label: "Notifications", unit: "", sample: 3, goal: 10 },
  altitude: { label: "Altitude", unit: " m", sample: 420, goal: 1000 },
  pressure: {
    label: "Sea-level pressure",
    unit: " hPa",
    sample: 1013,
    goal: 1100,
  },
  race5k: { label: "5K prediction", unit: " s", sample: 1320, goal: 1800 },
  race10k: { label: "10K prediction", unit: " s", sample: 2760, goal: 3600 },
  raceHalf: {
    label: "Half-marathon prediction",
    unit: " s",
    sample: 6300,
    goal: 7200,
  },
  raceMarathon: {
    label: "Marathon prediction",
    unit: " s",
    sample: 13200,
    goal: 14400,
  },

  steps: { label: "Steps", unit: " steps", sample: 6248, goal: 10000 },
  battery: { label: "Battery", unit: "% battery", sample: 82, goal: 100 },
  heartRate: { label: "Heart rate", unit: " bpm", sample: 68, goal: 200 },
  calories: { label: "Calories", unit: " kcal", sample: 1450, goal: 2000 },
  distance: { label: "Distance", unit: " km", sample: 4, goal: 10 },
  floors: { label: "Floors", unit: " floors", sample: 6, goal: 10 },
  activeMinutes: {
    label: "Active minutes",
    unit: " min",
    sample: 32,
    goal: 60,
  },
  bodyBattery: {
    label: "Body Battery",
    unit: "% energy",
    sample: 74,
    goal: 100,
  },
  stress: { label: "Stress", unit: " stress", sample: 24, goal: 100 },
  recovery: { label: "Recovery", unit: " h", sample: 12, goal: 72 },
  weather: { label: "Weather", unit: " C", sample: 22, goal: 50 },
} as const;
export type Metric = keyof typeof METRICS;
export const SHAPES = [
  "circle",
  "rectangle",
  "line",
  "arc",
  "dial",
  "field-dial",
  "vertical-line",
  "left-arc",
  "right-arc",
] as const;
export const ICONS = ["heart", "battery", "steps", "sun", "star"] as const;
export const isMetric = (type: string): type is Metric =>
  Object.hasOwn(METRICS, type);
export const isGraphic = (type: string, variant = "labeled") =>
  ["shape", "icon", "image", "progress", "chart"].includes(type) ||
  ["ring", "bar", "analog", "analog-seconds", "condition-icon"].includes(
    variant,
  );
export function layerVariants(type: string): readonly string[] {
  if (type === "status") return Object.keys(STATUS_SOURCES);
  if (type === "complication") return ["labeled", "value", "ring", "bar"];
  if (type === "chart") return ["line", "bar"];
  if (type === "weather")
    return [
      "labeled",
      "value",
      "temperature",
      "feels-like",
      "humidity",
      "wind",
      "condition-icon",
      "high",
      "low",
      "sunrise",
      "sunset",
      "ring",
      "bar",
    ];
  if (type === "battery")
    return ["labeled", "value", "percentage", "ring", "bar"];
  if (type === "time")
    return [
      "labeled",
      "seconds",
      "hours",
      "minutes",
      "analog",
      "analog-seconds",
    ];
  if (type === "date") return ["labeled", "full", "day"];
  if (type === "shape") return SHAPES;
  if (type === "icon") return ICONS;
  if (type === "image") return ["image", "pixel"];
  if (type === "progress") return ["ring", "bar"];
  if (isMetric(type)) return ["labeled", "value", "ring", "bar"];
  return ["labeled"];
}

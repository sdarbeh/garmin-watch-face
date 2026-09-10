import { METRICS, type Metric } from "./layer-catalog";
/** Native Garmin sources with explicit units. Values are converted only for display.
 * API reference: developer.garmin.com/connect-iq/api-docs/Toybox/Complications.html
 */
export const COMPLICATIONS = {
  battery: {
    label: "Battery",
    constant: "BATTERY",
    sample: 82,
    unit: "%",
    divisor: 1,
    decimals: 0,
  },
  altitude: {
    label: "Altitude",
    constant: "ALTITUDE",
    sample: 420,
    unit: " m",
    divisor: 1,
    decimals: 0,
  },
  pressure: {
    label: "Sea-level pressure",
    constant: "SEA_LEVEL_PRESSURE",
    sample: 101300,
    unit: " hPa",
    divisor: 100,
    decimals: 0,
  },
  race5k: {
    label: "5K prediction",
    constant: "RACE_PREDICTOR_5K",
    sample: 1320,
    unit: " s",
    divisor: 1,
    decimals: 0,
  },
  race10k: {
    label: "10K prediction",
    constant: "RACE_PREDICTOR_10K",
    sample: 2760,
    unit: " s",
    divisor: 1,
    decimals: 0,
  },
  raceHalf: {
    label: "Half-marathon prediction",
    constant: "RACE_PREDICTOR_HALF_MARATHON",
    sample: 6300,
    unit: " s",
    divisor: 1,
    decimals: 0,
  },
  raceMarathon: {
    label: "Marathon prediction",
    constant: "RACE_PREDICTOR_MARATHON",
    sample: 13200,
    unit: " s",
    divisor: 1,
    decimals: 0,
  },
  heartRate: {
    label: "Heart rate",
    constant: "HEART_RATE",
    sample: 68,
    unit: " bpm",
    divisor: 1,
    decimals: 0,
  },
  bodyBattery: {
    label: "Body Battery",
    constant: "BODY_BATTERY",
    sample: 74,
    unit: "",
    divisor: 1,
    decimals: 0,
  },
  stress: {
    label: "Stress",
    constant: "STRESS",
    sample: 24,
    unit: "",
    divisor: 1,
    decimals: 0,
  },
  recovery: {
    label: "Recovery time",
    constant: "RECOVERY_TIME",
    sample: 720,
    unit: " h",
    divisor: 60,
    decimals: 1,
  },
  steps: {
    label: "Steps",
    constant: "STEPS",
    sample: 6248,
    unit: " steps",
    divisor: 1,
    decimals: 0,
  },
  floors: {
    label: "Floors climbed",
    constant: "FLOORS_CLIMBED",
    sample: 6,
    unit: " floors",
    divisor: 1,
    decimals: 0,
  },
  calories: {
    label: "Calories",
    constant: "CALORIES",
    sample: 1450,
    unit: " kcal",
    divisor: 1,
    decimals: 0,
  },
  intensityMinutes: {
    label: "Weekly intensity minutes",
    constant: "INTENSITY_MINUTES",
    sample: 186,
    unit: " min",
    divisor: 1,
    decimals: 0,
  },
  runDistance: {
    label: "Weekly running distance",
    constant: "WEEKLY_RUN_DISTANCE",
    sample: 26400,
    unit: " km",
    divisor: 1000,
    decimals: 1,
  },
  bikeDistance: {
    label: "Weekly cycling distance",
    constant: "WEEKLY_BIKE_DISTANCE",
    sample: 78500,
    unit: " km",
    divisor: 1000,
    decimals: 1,
  },
  vo2Run: {
    label: "Running VO2 max",
    constant: "VO2MAX_RUN",
    sample: 54,
    unit: "",
    divisor: 1,
    decimals: 0,
  },
  vo2Bike: {
    label: "Cycling VO2 max",
    constant: "VO2MAX_BIKE",
    sample: 52,
    unit: "",
    divisor: 1,
    decimals: 0,
  },
  pulseOx: {
    label: "Pulse Ox",
    constant: "PULSE_OX",
    sample: 98,
    unit: "%",
    divisor: 1,
    decimals: 0,
  },
  respiration: {
    label: "Respiration",
    constant: "RESPIRATION_RATE",
    sample: 16,
    unit: " brpm",
    divisor: 1,
    decimals: 0,
  },
  notifications: {
    label: "Notifications",
    constant: "NOTIFICATION_COUNT",
    sample: 3,
    unit: "",
    divisor: 1,
    decimals: 0,
  },
} as const;
export type ComplicationSource = keyof typeof COMPLICATIONS;
export interface ComplicationSettings {
  source: ComplicationSource;
  showUnit: boolean;
  openOnHold: boolean;
}
export type ComplicationSamples = Partial<
  Record<ComplicationSource, number | null>
>;
export function complicationSample(
  settings: ComplicationSettings,
  values: ComplicationSamples = {},
) {
  const source = COMPLICATIONS[settings.source];
  const value = Object.hasOwn(values, settings.source)
    ? values[settings.source]
    : source.sample;
  return value == null || !Number.isFinite(value)
    ? "--"
    : (value / source.divisor).toFixed(source.decimals) +
        (settings.showUnit ? source.unit : "");
}
export function supportsComplication(
  device: {
    capabilities: { complications?: readonly string[]; apiLevel?: string };
  },
  source: string,
): source is ComplicationSource {
  return (
    Object.hasOwn(COMPLICATIONS, source) &&
    (!device.capabilities.apiLevel ||
      apiAtLeast(device.capabilities.apiLevel, "4.2.0")) &&
    Boolean(device.capabilities.complications?.includes(source))
  );
}

export const isComplicationSource = (
  source: string,
): source is ComplicationSource => Object.hasOwn(COMPLICATIONS, source);
export function complicationMetric(source: ComplicationSource): Metric {
  return source;
}
export function complicationGoal(source: ComplicationSource) {
  return METRICS[source].goal;
}

/** All registered native sources currently require API 4.2.0 or earlier. */
export function apiAtLeast(actual: string, minimum: string) {
  const a = actual.split(".").map(Number),
    b = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
}

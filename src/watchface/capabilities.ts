import { isComplicationSource } from "./complications";
import { METRICS, type Metric } from "./layer-catalog";

export const ELEMENTS = [
  "time",
  "date",
  "steps",
  "battery",
  "text",
  "heartRate",
  "calories",
  "distance",
  "floors",
  "activeMinutes",
  "bodyBattery",
  "stress",
  "recovery",
  "weather",
  "progress",
  "chart",
  "complication",
  "status",
  "shape",
  "icon",
  "image",
] as const;
export type ElementType = (typeof ELEMENTS)[number];

/** Structural profile allows capability checks without coupling to one device. */
export interface CapabilityDevice {
  capabilities: {
    layers: readonly string[];
    complications?: readonly string[];
    chartSources?: readonly string[];
    apiLevel?: string;
    alwaysOn: boolean;
    lowBattery: boolean;
    nightLayout: boolean;
  };
}
export const DISPLAY_MODES = {
  normal: null,
  "always-on": "alwaysOn",
  "low-battery": "lowBattery",
  night: "nightLayout",
} as const;
export type DisplayMode = keyof typeof DISPLAY_MODES;
export function supportsMode(device: CapabilityDevice, mode: DisplayMode) {
  const requirement = DISPLAY_MODES[mode];
  return requirement === null || device.capabilities[requirement];
}
export function supportsLayer(
  device: CapabilityDevice,
  type: string,
): type is ElementType {
  return (
    (ELEMENTS as readonly string[]).includes(type) &&
    device.capabilities.layers.includes(type)
  );
}
export function supportedLayers(device: CapabilityDevice) {
  return ELEMENTS.filter((type) => supportsLayer(device, type));
}
export function supportedMetrics(device: CapabilityDevice) {
  return (Object.keys(METRICS) as Metric[]).filter((type) =>
    supportsMetric(device, type),
  );
}

export function supportsMetric(device: CapabilityDevice, type: string) {
  return (
    supportsLayer(device, type) ||
    (isComplicationSource(type) &&
      Boolean(device.capabilities.complications?.includes(type)))
  );
}

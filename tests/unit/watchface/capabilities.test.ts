import { expect, it } from "vitest";
import { devices } from "@/devices/catalog";
import {
  supportedLayers,
  supportedMetrics,
  supportsLayer,
  supportsMode,
} from "@/watchface/capabilities";
import { dataPermissions } from "@/watchface/data-sources";
import { getPreset } from "@/presets/catalog";

it("filters layer and progress-source menus through the same device profile", () => {
  const device = {
    capabilities: {
      layers: ["time", "steps", "progress", "unimplemented"],
      alwaysOn: false,
      lowBattery: true,
      nightLayout: false,
    },
  };
  expect(supportedLayers(device)).toEqual(["time", "steps", "progress"]);
  expect(supportedMetrics(device)).toEqual(["steps"]);
  expect(supportsLayer(device, "unimplemented")).toBe(false);
  expect(supportsLayer(device, "heartRate")).toBe(false);
  expect(supportsMode(device, "normal")).toBe(true);
  expect(supportsMode(device, "always-on")).toBe(false);
  expect(supportsMode(device, "night")).toBe(false);
  expect(supportsMode(device, "low-battery")).toBe(true);
});
it("deduplicates permissions and only requests solar positioning when needed", () => {
  expect(dataPermissions(["steps", "battery"], false)).toEqual([]);
  expect(dataPermissions(["heartRate", "bodyBattery"], false)).toEqual([
    "SensorHistory",
  ]);
  expect(dataPermissions(["weather"], true)).toEqual(["Positioning"]);
});
it("exposes Lunar with a night layout and no obsolete Sleep preset", () => {
  expect(getPreset("lunar")?.name).toBe("Lunar");
  expect(getPreset("lunar")?.design.layouts?.night).toBeDefined();
  expect(getPreset("sleep")).toBeUndefined();
  expect(supportedLayers(devices[0])).toHaveLength(
    devices[0].capabilities.layers.length,
  );
});

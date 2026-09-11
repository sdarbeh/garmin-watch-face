import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { devices } from "@/devices/catalog";
import {
  defaultDesign,
  designForDevice,
  validateDesign,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { presets } from "@/presets/catalog";

it("targets each supported watch and preserves every preset layout", () => {
  expect(new Set(devices.map((device) => device.id)).size).toBe(devices.length);
  expect(new Set(devices.map((device) => device.slug)).size).toBe(
    devices.length,
  );
  for (const device of devices) {
    expect(existsSync(join(process.cwd(), "public", device.preview))).toBe(
      true,
    );
    expect(existsSync(join(process.cwd(), "public", device.frame.image))).toBe(
      true,
    );
    expect(device.frame.screenX + device.width).toBeLessThanOrEqual(
      device.frame.width,
    );
    expect(device.frame.screenY + device.height).toBeLessThanOrEqual(
      device.frame.height,
    );
    expect(validateDesign(defaultDesign(device.id)).device).toBe(device.id);
    for (const preset of presets) {
      expect(preset.compatibleDevices).toContain(device.id);
      const design = designForDevice(preset.design, device.id);
      expect(design.device).toBe(device.id);
      expect(design.elements.map((e) => [e.id, e.x, e.y])).toEqual(
        preset.design.elements.map((e) => [e.id, e.x, e.y]),
      );
      const files = generateProject(design);
      expect(files["manifest.xml"]).toContain(
        `<iq:product id="${device.id}"/>`,
      );
      expect(Boolean(files["resources/watchface-config.xml"])).toBe(
        device.capabilities.onWatchSettings,
      );
    }
  }
});

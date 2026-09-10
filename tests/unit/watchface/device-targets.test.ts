import { expect, it } from "vitest";
import { devices } from "../../../src/devices/catalog";
import {
  defaultDesign,
  designForDevice,
  validateDesign,
} from "../../../src/watchface/schema";
import { generateProject } from "../../../src/watchface/generator";
import { presets } from "../../../src/presets/catalog";

it("targets each supported watch and preserves every preset layout", () => {
  expect(devices).toHaveLength(4);
  for (const device of devices) {
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

import { describe, expect, it } from "vitest";
import { getDeviceById } from "@/devices/catalog";
import { supportedLayers } from "@/watchface/capabilities";
import {
  ELEMENT_TEMPLATE_CATEGORIES,
  searchElementTemplates,
  templatesForDevice,
} from "@/components/editor/model/element-templates";

describe("element templates", () => {
  const device = getDeviceById("fr970")!;
  const templates = templatesForDevice(device);

  it("keeps every supported element family discoverable", () => {
    const categories = new Set(templates.map((template) => template.category));

    expect(categories).toEqual(
      new Set(ELEMENT_TEMPLATE_CATEGORIES.map((category) => category.id)),
    );
    expect(new Set(templates.map((template) => template.layerType))).toEqual(
      new Set(supportedLayers(device)),
    );
  });

  it("keeps equally relevant matches in intentional catalog order", () => {
    const results = searchElementTemplates(templates, "battery");

    expect(results[0].id).toBe("body-battery");
    expect(results.map((template) => template.id)).toContain("device-battery");
  });

  it("matches natural multi-word searches", () => {
    expect(searchElementTemplates(templates, "rain icon")[0].id).toBe(
      "weather-condition",
    );
  });
});

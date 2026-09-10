import { expect, it } from "vitest";
import { presets, featuredPresets } from "../../../src/presets/catalog";
import { getDeviceById } from "../../../src/devices/catalog";
import { parseProject, serializeProject } from "../../../src/watchface/schema";
import { powerLayout, updateModeLayout } from "../../../src/watchface/power";
import { renderModel } from "../../../src/watchface/render-model";
import { elementBounds } from "../../../src/components/editor/model/geometry";

it("ships explicit, portable power layouts for all presets and featured entries", () => {
  for (const { design } of [...presets, ...featuredPresets]) {
    expect(design.layouts?.["always-on"]).toBeDefined();
    expect(design.layouts?.["low-battery"]).toBeDefined();
    expect(parseProject(serializeProject(design))).toEqual(design);
    expect(design.layouts!["low-battery"]!.elements.map((e) => e.type)).toEqual(
      ["date", "time", "battery"],
    );
  }
});
it("fits always-on glyphs inside the device's moving drawing region", () => {
  for (const { design } of presets) {
    const area = getDeviceById(design.device)!.power.alwaysOn;
    for (const minute of [0, 1]) {
      const aod = powerLayout(design, "always-on", minute);
      expect(aod.background).toBe("#000000");
      const e = renderModel(aod)[0];
      const bounds = elementBounds(e);
      expect(bounds.width).toBeLessThanOrEqual(area.clipWidth);
      expect(bounds.height).toBeLessThanOrEqual(area.clipHeight);
      expect(e.y).toBe(area.centerY + minute * area.shiftY);
    }
  }
});
it("edits a copied preset mode without changing its other layouts or the preset", () => {
  for (const { design } of presets) {
    const copy = parseProject(serializeProject(design));
    const mode = powerLayout(copy, "low-battery");
    const edited = updateModeLayout(copy, "low-battery", {
      ...mode,
      elements: mode.elements.map((e) => ({ ...e, color: "#FFFFFF" })),
    });
    expect(edited.elements).toEqual(design.elements);
    expect(edited.layouts!["always-on"]).toEqual(design.layouts!["always-on"]);
    expect(edited.layouts!["low-battery"]).not.toEqual(
      design.layouts!["low-battery"],
    );
  }
});

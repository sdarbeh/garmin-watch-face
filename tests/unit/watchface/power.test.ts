import { DesignHistory } from "@/components/editor/model/history";
import { resetModeLayout, updateModeLayout } from "@/watchface/power";
import { expect, it } from "vitest";
import { devices } from "@/devices/catalog";
import {
  defaultDesign,
  validateDesign,
  parseProject,
  serializeProject,
} from "@/watchface/schema";
import {
  powerLayout,
  lowBatteryThreshold,
  resolvePowerMode,
} from "@/watchface/power";
import { generateProject } from "@/watchface/generator";
import { estimateAodLuminance } from "@/watchface/aod";
it("keeps a restrained AOD fallback while allowing the full face", () => {
  const design = defaultDesign();
  const layout = powerLayout(design, "always-on");
  expect(layout.background).toBe("#000000");
  expect(layout.elements).toHaveLength(1);
  expect(layout.elements[0].y).toBe(227);
  expect(estimateAodLuminance(layout)).toBeLessThan(
    devices[0].power.alwaysOn.maxLuminance,
  );
});
it("validates and persists the threshold, and emits automatic runtime branches", () => {
  const design = defaultDesign();
  expect(lowBatteryThreshold(design)).toBe(10);
  design.power = { lowBatteryThreshold: 20 };
  expect(parseProject(serializeProject(design))).toEqual(design);
  expect(generateProject(design)["source/FaceApp.mc"]).toContain(
    "if (battery <= 20)",
  );
  expect(generateProject(design)["source/FaceApp.mc"]).toContain(
    "dc.setClip(0, 0 + (clock.min % 2) * 0, 454, 454)",
  );
  for (const threshold of [0, 31, 1.5, "10"])
    expect(() =>
      validateDesign({ ...design, power: { lowBatteryThreshold: threshold } }),
    ).toThrow();
});
it("uses safe fallback time when no visible time layer exists and preserves the normal design", () => {
  const design = defaultDesign();
  design.elements = [];
  const original = serializeProject(design);
  expect(powerLayout(design, "always-on").elements[0].timeFormat).toBe("12");
  expect(
    powerLayout(design, "low-battery").elements.map((e) => e.type),
  ).toEqual(["time", "battery"]);
  expect(serializeProject(design)).toBe(original);
});

it("switches at the threshold and restores normal above it, with always-on taking precedence", () => {
  const design = defaultDesign();
  expect(resolvePowerMode(design, "normal", 10)).toBe("low-battery");
  expect(resolvePowerMode(design, "normal", 11)).toBe("normal");
  expect(resolvePowerMode(design, "always-on", 5)).toBe("always-on");
});

it("edits each mode independently and preserves them through export and history", () => {
  const original = defaultDesign();
  const low = powerLayout(original, "low-battery");
  low.elements = [
    { ...low.elements[0], family: "rubikbubbles", color: "#00AAAA" },
  ];
  const edited = updateModeLayout(original, "low-battery", low);
  expect(edited.elements).toEqual(original.elements);
  expect(powerLayout(edited, "low-battery").elements[0].family).toBe(
    "rubikbubbles",
  );
  const aod = powerLayout(edited, "always-on");
  aod.elements[0] = {
    ...aod.elements[0],
    family: "doto",
    size: 32,
    x: 400,
    y: 400,
  };
  const both = updateModeLayout(edited, "always-on", aod);
  expect(both.layouts?.["always-on"]?.elements[0]).toMatchObject({
    x: 400,
    y: 400,
  });
  expect(parseProject(serializeProject(both))).toEqual(both);
  const history = new DesignHistory();
  history.record(original, edited);
  history.record(edited, both);
  expect(history.undo(both)).toEqual(edited);
  expect(history.redo(edited)).toEqual(both);
  const source = generateProject(both);
  expect(source["resources/fonts/fonts.xml"]).toContain("doto_400_32");
  expect(source["resources/fonts/fonts.xml"]).toContain("rubikbubbles_400_80");
  expect(source["source/FaceApp.mc"]).toContain("400 + (clock.min % 2) * 0");
});

it("removes a mode override without changing the normal design or other modes", () => {
  const original = defaultDesign();
  const low = updateModeLayout(original, "low-battery", {
    ...original,
    elements: [],
  });
  const withBoth = updateModeLayout(low, "always-on", {
    ...original,
    elements: [],
  });
  const reset = resetModeLayout(withBoth, "low-battery");
  expect(reset.elements).toEqual(original.elements);
  expect(reset.layouts?.["low-battery"]).toBeUndefined();
  expect(reset.layouts?.["always-on"]).toBeDefined();
  expect(resetModeLayout(original, "normal")).toBe(original);
});

it("rejects invalid mode data and preserves intentionally empty layouts", () => {
  const original = defaultDesign();
  expect(() =>
    validateDesign({ ...original, layouts: { arbitrary: {} } }),
  ).toThrow();
  expect(() =>
    validateDesign({
      ...original,
      layouts: { "always-on": { background: "#FFFFFF", elements: [] } },
    }),
  ).toThrow();
  expect(() =>
    validateDesign({
      ...original,
      layouts: {
        "always-on": { background: "#FFFFFF", elements: original.elements },
      },
    }),
  ).toThrow();
  const empty = updateModeLayout(original, "low-battery", {
    ...original,
    elements: [],
  });
  expect(
    powerLayout(parseProject(serializeProject(empty)), "low-battery").elements,
  ).toEqual([]);
});

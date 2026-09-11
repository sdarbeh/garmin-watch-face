import { expect, it } from "vitest";
import {
  createElement,
  defaultDesign,
  parseProject,
  serializeProject,
  validateDesign,
} from "@/watchface/schema";
import {
  isNightActive,
  powerLayout,
  resolvePowerMode,
  updateModeLayout,
} from "@/watchface/power";
import { generateProject, usedFonts } from "@/watchface/generator";

const design = () => ({
  ...defaultDesign(),
  night: { enabled: true, trigger: "schedule" as const, start: 1320, end: 420 },
});
it("handles overnight and daytime schedules with an exclusive end", () => {
  const face = design();
  for (const [minute, active] of [
    [1319, false],
    [1320, true],
    [1439, true],
    [0, true],
    [419, true],
    [420, false],
  ] as const)
    expect(isNightActive(face, minute)).toBe(active);
  face.night.start = 60;
  face.night.end = 120;
  expect(isNightActive(face, 60)).toBe(true);
  expect(isNightActive(face, 120)).toBe(false);
});
it("uses DND independently of the schedule and respects disabled state", () => {
  const face = {
    ...design(),
    night: { ...design().night, trigger: "dnd" as const },
  };
  expect(isNightActive(face, 0, false)).toBe(false);
  expect(isNightActive(face, 720, true)).toBe(true);
  face.night.enabled = false;
  expect(isNightActive(face, 0, true)).toBe(false);
});
it("prioritizes explicit always-on and low battery over automatic night", () => {
  expect(resolvePowerMode(design(), "always-on", 5, 0)).toBe("always-on");
  expect(resolvePowerMode(design(), "normal", 5, 0)).toBe("low-battery");
  expect(resolvePowerMode(design(), "normal", 80, 0)).toBe("night");
  expect(resolvePowerMode(design(), "normal", 80, 720)).toBe("normal");
});
it("persists editable night layers independently and compiles their resources", () => {
  const original = design();
  const edited = powerLayout(original, "night");
  edited.elements = [
    {
      ...createElement("text", "night-text"),
      family: "doto",
      size: 56,
      text: "GOOD NIGHT",
    },
  ];
  const next = updateModeLayout(original, "night", edited);
  const loaded = parseProject(serializeProject(next));
  expect(loaded.elements).toEqual(original.elements);
  expect(powerLayout(loaded, "night").elements).toEqual(edited.elements);
  expect(usedFonts(loaded).some((font) => font.key === "doto_400_56")).toBe(
    true,
  );
  const source = Object.values(generateProject(loaded)).join("\n");
  expect(source).toContain("minuteOfDay >= 1320 || minuteOfDay < 420");
  expect(source).toContain('"GOOD NIGHT"');
  expect(
    Object.values(
      generateProject({
        ...loaded,
        night: { ...loaded.night!, trigger: "dnd" },
      }),
    ).join("\n"),
  ).toContain("settings has :doNotDisturb");
});
it("rejects invalid night configuration", () => {
  for (const patch of [
    { start: -1 },
    { end: 1440 },
    { start: 420 },
    { trigger: "unknown" },
    { enabled: 1 },
  ])
    expect(() =>
      validateDesign({ ...design(), night: { ...design().night, ...patch } }),
    ).toThrow();
});

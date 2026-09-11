import { expect, it } from "vitest";
import { getPreset } from "@/presets/catalog";
import { ruleAppearance } from "@/watchface/rules";
import { SAMPLE_DATA } from "@/watchface/render-model";
it("uses progressively stronger stress feedback and keeps night colors muted", () => {
  const d = getPreset("wellness")!.design;
  const stress = d.elements.find((e) => e.type === "stress")!;
  const colors = [24, 51, 76].map(
    (value) =>
      ruleAppearance(
        stress.rules!,
        { ...SAMPLE_DATA, stress: String(value) },
        stress.color,
      ).color,
  );
  expect(new Set(colors).size).toBe(3);
  expect(
    d.layouts!.night!.elements.find((e) => e.type === "stress")!.rules![1]
      .color,
  ).not.toBe(stress.rules![1].color);
  expect(
    d.elements.filter((e) => e.type === "text").map((e) => e.text),
  ).toEqual(["BODY BATTERY"]);
  expect(d.elements.find((e) => e.type === "chart")).toBeDefined();
});

import { expect, it } from "vitest";
import { defaultDesign, validateDesign } from "@/watchface/schema";
import { downloadFilename } from "@/watchface/download-filename";
import { presets } from "@/presets/catalog";

it("names files by project, device, and timestamp", () => {
  expect(
    downloadFilename(defaultDesign(), new Date("2026-09-10T18:05:06.123Z")),
  ).toBe("my-watch-face-forerunner-970-2026-09-10T18-05-06-123Z.prg");
});
it("enables supported features for starters and presets without changing saved opt-outs", () => {
  for (const design of [defaultDesign(), ...presets.map((p) => p.design)]) {
    expect(design.onWatch).toBe(true);
    expect(design.night?.enabled).toBe(true);
    expect(design.night?.trigger).toBe("dnd");
  }
  const optedOut = {
    ...defaultDesign(),
    onWatch: false,
    night: { enabled: false, trigger: "dnd" as const, start: 1320, end: 420 },
  };
  expect(validateDesign(optedOut).onWatch).toBe(false);
  expect(validateDesign(optedOut).night?.enabled).toBe(false);
});

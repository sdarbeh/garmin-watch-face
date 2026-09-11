import { expect, it } from "vitest";
import sharp from "sharp";
import { validateImage, presentation } from "@/watchface/schema";
import { getPreset } from "@/presets/catalog";
import { usedImages } from "@/watchface/garmin-layers";
import { generateProject } from "@/watchface/generator";

it("accepts watch-resolution PNGs and rejects oversized dimensions and data", async () => {
  const image = async (width: number) =>
    "data:image/png;base64," +
    (
      await sharp({
        create: { width, height: 454, channels: 4, background: "#507050" },
      })
        .png()
        .toBuffer()
    ).toString("base64");
  expect(() => validateImage("not a PNG")).toThrow();
  const full = await image(454);
  expect(() => validateImage(full)).not.toThrow();
  const large = await image(455);
  expect(() => validateImage(large)).toThrow(/dimensions/);
  expect(() =>
    validateImage("data:image/png;base64," + "A".repeat(350000)),
  ).toThrow();
});
it("ships full-resolution scenery with smooth scaling", async () => {
  for (const slug of ["summit", "this-is-fine", "starfield", "trail-data"]) {
    const image = usedImages(getPreset(slug)!.design).find(
      (e) => e.width === 454,
    )!;
    const metadata = await sharp(
      Buffer.from(image.image.split(",")[1], "base64"),
    ).metadata();
    expect(metadata.width).toBe(454);
    expect(metadata.height).toBe(454);
  }
  expect(
    usedImages(getPreset("starfield")!.design).every((e) => !e.pixelated),
  ).toBe(true);
});
it("draws Panda's normal dial as primitives with a dark night dial", () => {
  const design = getPreset("panda")!.design;
  expect(design.elements.some((e) => presentation(e).variant === "dial")).toBe(
    true,
  );
  expect(design.elements.some((e) => e.type === "image")).toBe(false);
  expect(design.layouts?.night?.elements.some((e) => e.type === "image")).toBe(
    true,
  );
  expect(Object.values(generateProject(design)).join("\n")).toContain(
    "dc.fillCircle(",
  );
});

import { expect, it } from "vitest";
import {
  defaultDesign,
  parseProject,
  serializeProject,
  validateDesign,
} from "@/watchface/schema";
import { fontMetrics, textWidth, fontDescriptor } from "@/watchface/fonts";
import { renderModel } from "@/watchface/render-model";
import { generateProject, usedFonts } from "@/watchface/generator";
import { elementBounds } from "@/components/editor/model/geometry";

it("round trips typography and rejects unsupported combinations", () => {
  const design = defaultDesign();
  Object.assign(design.elements[0], {
    family: "doto",
    weight: 700,
    size: 64,
    alignment: "right",
  });
  expect(parseProject(serializeProject(design))).toEqual(design);
  for (const patch of [
    { family: "unknown" },
    { family: "rubikbubbles", weight: 700 },
    { size: 999 },
    { alignment: "justify" },
  ]) {
    const invalid = structuredClone(design);
    Object.assign(invalid.elements[0], patch);
    expect(() => validateDesign(invalid)).toThrow();
  }
});
it("uses identical glyph advances for bounds and BMFont resources", () => {
  const design = defaultDesign();
  const element = design.elements[0];
  element.family = "doto";
  element.alignment = "left";
  const rendered = renderModel(design)[0];
  const metrics = fontMetrics(element);
  const width = textWidth(rendered.sample, metrics);
  expect(elementBounds(rendered)).toMatchObject({
    width,
    left: element.x - width,
    centerX: element.x - width / 2,
  });
  const descriptor = fontDescriptor(rendered.font.key, rendered.sample);
  const glyph = metrics.glyphs["98"];
  expect(descriptor).toContain(`xadvance=${glyph[6]}`);
});
it("uses native vector fonts and packages only visible custom fonts", () => {
  const design = defaultDesign();
  design.elements[0].family = "rubikbubbles";
  design.elements[1].family = "doto";
  design.elements[1].visible = false;
  design.elements[0].alignment = "right";
  const files = generateProject(design);
  const source = files["source/FaceApp.mc"];
  expect(source).toContain("Graphics.getVectorFont");
  expect(source).toContain(
    "WatchUi.loadResource(Rez.Fonts.rubikbubbles_400_40)",
  );
  expect(source).toContain("Graphics.TEXT_JUSTIFY_LEFT");
  expect(usedFonts(design).map((font) => font.key)).toEqual([
    "rubikbubbles_400_40",
  ]);
  expect(files["resources/fonts/rubikbubbles_400_40.fnt"]).toContain(
    "page id=0",
  );
});

it("shares time format between saved designs, preview, and code", () => {
  const design = defaultDesign();
  const time = design.elements.find((element) => element.type === "time")!;
  Object.assign(time, { timeFormat: "12", size: 72 });
  expect(parseProject(serializeProject(design))).toEqual(design);
  expect(
    renderModel(design).find((element) => element.id === time.id),
  ).toMatchObject({ sample: "01:09", opacity: 100 });
  expect(generateProject(design)["source/FaceApp.mc"]).toContain(
    ", timeText12, Graphics.TEXT_JUSTIFY",
  );
  time.timeFormat = "24";
  expect(
    renderModel(design).find((element) => element.id === time.id)?.sample,
  ).toBe("13:09");
  for (const patch of [
    { opacity: 50 },
    { opacity: 101 },
    { timeFormat: "auto" },
  ]) {
    const invalid = structuredClone(design);
    Object.assign(invalid.elements[0], patch);
    expect(() => validateDesign(invalid)).toThrow();
  }
});

it("positions left and right consistently in canvas bounds and Garmin output", () => {
  for (const [alignment, direction, justification] of [
    ["left", -1, "RIGHT"],
    ["center", 0, "CENTER"],
    ["right", 1, "LEFT"],
  ] as const) {
    const design = defaultDesign();
    design.elements = [{ ...design.elements[0], alignment }];
    const element = renderModel(design)[0];
    const bounds = elementBounds(element);
    expect(Math.sign(bounds.centerX - element.x)).toBe(direction);
    expect(generateProject(design)["source/FaceApp.mc"]).toContain(
      `Graphics.TEXT_JUSTIFY_${justification} |`,
    );
  }
});

it("round trips custom colors and emits validated Garmin RGB literals", () => {
  const design = { ...defaultDesign(), onWatch: false };
  design.background = "#123abc";
  design.elements[0].color = "#e84f97";
  const saved = parseProject(serializeProject(design));
  expect(saved.background).toBe("#123ABC");
  expect(renderModel(saved)[0].color).toBe("#E84F97");
  const source = generateProject(saved)["source/FaceApp.mc"];
  expect(source).toContain("var ruleColor = 0xE84F97");
  expect(source).toContain("dc.setColor(0x123ABC, 0x123ABC)");
  for (const color of [
    "red",
    "#123",
    "#12345678",
    "#GG0000",
    "#FFFFFF);evil()",
    " #123456",
  ]) {
    expect(() => validateDesign({ ...design, background: color })).toThrow();
  }
});

it("packages Anton separately from Garmin Native with matching preview metrics", () => {
  const design = defaultDesign();
  const time = design.elements.find((e) => e.type === "time")!;
  time.family = "anton";
  const rendered = renderModel(design).find((e) => e.type === "time")!;
  expect(rendered.font.atlasKey).toBe("anton_400_120");
  expect(elementBounds(rendered).width).toBe(
    textWidth(rendered.sample, fontMetrics(time)),
  );
  expect(parseProject(serializeProject(design))).toEqual(design);
  const source = Object.values(generateProject(design)).join("\n");
  expect(source).toContain("anton_400_120.fnt");
  expect(source).toContain("Graphics.getVectorFont");
  time.weight = 700;
  expect(() => validateDesign(design)).toThrow();
});

import { expect, it } from "vitest";
import { presets, getPreset } from "../../../src/presets/catalog";
import { renderModel, SAMPLE_DATA } from "../../../src/watchface/render-model";
import { presentation } from "../../../src/watchface/schema";
import { isGraphic } from "../../../src/watchface/layer-catalog";
import { elementBounds } from "../../../src/components/editor/model/geometry";

function inkBounds(e: ReturnType<typeof renderModel>[number]) {
  let advance = 0;
  const left = elementBounds(e).left;
  const boxes = [...e.sample].flatMap((char) => {
    const [, , width, height, xo, yo, xa] =
      e.font.glyphs[String(char.charCodeAt(0))] ?? e.font.glyphs["63"];
    const box = {
      left: left + advance + xo,
      right: left + advance + xo + width,
      top: e.y - e.font.height / 2 + yo,
      bottom: e.y - e.font.height / 2 + yo + height,
    };
    advance += xa;
    return char.trim() ? [box] : [];
  });
  return {
    left: Math.min(...boxes.map((b) => b.left)),
    right: Math.max(...boxes.map((b) => b.right)),
    top: Math.min(...boxes.map((b) => b.top)),
    bottom: Math.max(...boxes.map((b) => b.bottom)),
  };
}
it("keeps preset text ink separated with representative wide readings", () => {
  for (const preset of presets) {
    const elements = renderModel(preset.design, {
      ...SAMPLE_DATA,
      time: "23:59:59",
      date: "WED 30 SEP",
      dateFull: "WED 30 SEP 2026",
      steps: "99999 steps",
      heartRate: "199 bpm",
      battery: "100% battery",
    }).filter((e) => !isGraphic(e.type, presentation(e).variant));
    for (let i = 0; i < elements.length; i++)
      for (let j = i + 1; j < elements.length; j++) {
        const a = inkBounds(elements[i]),
          b = inkBounds(elements[j]);
        const overlaps =
          a.left < b.right &&
          a.right > b.left &&
          a.top < b.bottom &&
          a.bottom > b.top;
        expect(
          overlaps,
          `${preset.slug}: ${elements[i].id} and ${elements[j].id}`,
        ).toBe(false);
      }
  }
});
it("uses 24px values in Panda's three subdials", () => {
  expect(
    getPreset("panda")!
      .design.elements.filter((e) =>
        ["steps", "heartRate", "battery"].includes(e.type),
      )
      .map((e) => e.size),
  ).toEqual([24, 24, 24]);
});

it("balances Race Day arcs around the same dial center", () => {
  const arcs = getPreset("race-day")!.design.elements.filter(
    (e) => e.type === "shape",
  );
  expect(arcs).toHaveLength(2);
  expect(
    arcs.map((e) => [e.x, e.y, presentation(e).width, presentation(e).height]),
  ).toEqual([
    [227, 227, 432, 432],
    [227, 227, 432, 432],
  ]);
});

it("aligns Weather Desk's primary readings and mirrored columns", () => {
  const elements = getPreset("weather-desk")!.design.elements;
  const time = elements.find((e) => e.type === "time")!;
  const temperature = elements.find(
    (e) => presentation(e).variant === "temperature",
  )!;
  expect([time.y, time.size, time.family, time.weight]).toEqual([
    temperature.y,
    temperature.size,
    temperature.family,
    temperature.weight,
  ]);
  expect(time.x + temperature.x).toBe(454);
  const sun = elements.filter((e) =>
    ["sunrise", "sunset"].includes(presentation(e).variant),
  );
  expect(sun[0].y).toBe(sun[1].y);
  expect(sun[0].x + sun[1].x).toBe(454);
});

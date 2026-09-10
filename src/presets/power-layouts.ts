import { isAnalog } from "../watchface/analog";
import { getDeviceById } from "../devices/catalog";
import {
  createElement,
  presentation,
  validateDesign,
  type Design,
} from "../watchface/schema";

/** Preset-specific accents on black; normal-mode artwork stays untouched. */
const accents: Record<string, string> = {
  simple: "#AAAAAA",
  "vital-rings": "#49DCAB",
  "heritage-watch": "#B8D1BD",
  "dot-matrix": "#FFFFFF",
};
export function withPresetPowerLayouts(
  design: Design,
  slug: string,
  themeAccent?: string,
): Design {
  const area = getDeviceById(design.device)!.power.alwaysOn;
  const source =
    design.elements.find((e) => e.type === "time") ??
    createElement("time", "time");
  const detailFamily = source.family === "anton" ? "garmin" : source.family;
  const accent = themeAccent ?? accents[slug] ?? "#AAAAAA";
  const motif = design.elements.find(
    (e) =>
      e.type === "icon" || (e.type === "image" && presentation(e).width <= 150),
  );
  const nightMotif = motif
    ? {
        ...motif,
        id: "night-motif",
        x: 227,
        y: 122,
        color: accent,
        presentation: { ...presentation(motif), width: 56, height: 56 },
      }
    : {
        ...createElement("text", "night-name"),
        text: design.name.toUpperCase(),
        x: 227,
        y: 132,
        family: detailFamily,
        color: accent,
        size: 24 as const,
      };

  const analog = isAnalog(presentation(source).variant);
  const hands = (diameter: number, stroke: number) =>
    analog
      ? {
          presentation: {
            ...presentation(source),
            variant: "analog",
            width: diameter,
            height: diameter,
            stroke,
          },
        }
      : {};
  const time = {
    ...createElement("time", "power-time"),
    family: source.family,
    timeFormat: source.timeFormat,
    weight: 400 as const,
  };
  return validateDesign({
    ...design,
    night: { enabled: true, trigger: "dnd", start: 1320, end: 420 },
    layouts: {
      night: {
        background: "#000000",
        elements: [
          nightMotif,
          { ...time, ...hands(150, 4), size: 64, color: accent, y: 221 },
          {
            ...createElement("battery", "night-battery"),
            family: detailFamily,
            size: 24,
            color: "#777777",
            y: 306,
            presentation: {
              ...presentation(createElement("battery", "night-battery")),
              variant: "percentage",
            },
          },
        ],
      },
      "always-on": {
        background: "#000000",
        elements: [
          {
            ...time,
            ...hands(56, 2),
            size: 40,
            color: area.color,
            x: area.centerX,
            y: area.centerY,
          },
        ],
      },
      "low-battery": {
        background: "#000000",
        elements: [
          {
            ...createElement("date", "power-date"),
            family: detailFamily,
            size: 24,
            color: accent,
            y: 132,
          },
          { ...time, ...hands(150, 4), size: 80, color: "#AAAAAA", y: 210 },
          {
            ...createElement("battery", "power-battery"),
            family: detailFamily,
            size: 32,
            color: accent,
            y: 292,
          },
        ],
      },
    },
  });
}

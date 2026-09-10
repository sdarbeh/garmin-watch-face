import {
  createElement,
  defaultDesign,
  presentation,
  type FaceElement,
  type ElementType,
} from "../watchface/schema";
import { isMetric, type Metric } from "../watchface/layer-catalog";
import { withPresetPowerLayouts } from "./power-layouts";
import type { Preset } from "./catalog";
export const palette = {
  white: "#FFFFFF",
  blue: "#24C5FF",
  gold: "#EFC75E",
  violet: "#A793FF",
  coral: "#FF7268",
  mint: "#58DCAE",
  muted: "#A0ABB5",
  track: "#202A32",
};
export function text(
  type: ElementType | Metric,
  x: number,
  y: number,
  size: FaceElement["size"],
  color = palette.white,
  label = "",
  family: FaceElement["family"] = "garmin",
): FaceElement {
  const e = {
    ...createElement(type, `${type}-${x}-${y}`),
    x,
    y,
    size,
    color,
    text: label,
    family,
  };
  if (isMetric(type)) e.presentation = { ...presentation(e), variant: "value" };
  return e;
}
export function shape(
  variant: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  stroke = 2,
): FaceElement {
  const e = text("shape", x, y, 24, color);
  e.presentation = { ...presentation(e), variant, width, height, stroke };
  return e;
}
export function icon(
  variant: string,
  x: number,
  y: number,
  color: string,
  size = 32,
): FaceElement {
  const e = text("icon", x, y, 24, color);
  e.presentation = {
    ...presentation(e),
    variant,
    width: size,
    height: size,
    stroke: 3,
  };
  return e;
}
export function art(
  data: string,
  x: number,
  y: number,
  width: number,
  height = width,
  pixelated = false,
): FaceElement {
  const e = text("image", x, y, 24);
  e.presentation = {
    ...presentation(e),
    width,
    height,
    image: data,
    variant: pixelated ? "pixel" : "image",
  };
  return e;
}
export function progress(
  source: Metric,
  x: number,
  y: number,
  width: number,
  color: string,
  goal: number,
  variant = "bar",
): FaceElement {
  const e = text("progress", x, y, 24, color);
  e.id = `progress-${source}-${x}-${y}`;
  e.presentation = {
    ...presentation(e),
    source,
    goal,
    variant,
    width,
    height: variant === "bar" ? 12 : width,
    stroke: 10,
  };
  return e;
}
export function cell(
  type: Metric,
  label: string,
  x: number,
  y: number,
  color = palette.white,
  family: FaceElement["family"] = "garmin",
) {
  return [
    text("text", x, y, 24, palette.muted, label, family),
    text(type, x, y + 38, 40, color, "", family),
  ];
}
export function time(
  x = 227,
  y = 210,
  size: FaceElement["size"] = 88,
  family: FaceElement["family"] = "garmin",
  color = palette.white,
) {
  return {
    ...text("time", x, y, size, color, "", family),
    weight: ["rubikbubbles", "garmin", "anton"].includes(family)
      ? (400 as const)
      : (700 as const),
  };
}
export function makePreset(
  slug: string,
  name: string,
  description: string,
  elements: FaceElement[],
  accent: string,
  background = "#000000",
): Preset {
  return {
    slug,
    name,
    description,
    compatibleDevices: ["fr970"],
    design: withPresetPowerLayouts(
      {
        ...defaultDesign(),
        name,
        background,
        elements: elements.map((element, index) => ({
          ...element,
          id: `${slug}-${index}`,
        })),
      },
      slug,
      accent,
    ),
  };
}

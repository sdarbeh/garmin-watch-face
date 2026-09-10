import { simplePreset } from "./dials";
import { analogTime } from "../watchface/analog";
import { withPresetPowerLayouts } from "./power-layouts";
import {
  createElement,
  defaultDesign,
  presentation,
  type FaceElement,
  type ElementType,
} from "../watchface/schema";
import { summitPreset } from "./themed";
import type { Preset } from "./catalog";

const colors = {
  white: "#FFFFFF",
  blue: "#009DFF",
  muted: "#AAAAAA",
  gold: "#C6A56D",
  cream: "#EEE7D6",
  ink: "#242A26",
};
function text(
  type: ElementType,
  x: number,
  y: number,
  size: FaceElement["size"],
  color = colors.white,
  label = "",
): FaceElement {
  const e = {
    ...createElement(type, `${type}-${x}-${y}`),
    x,
    y,
    size,
    color,
    family: "garmin" as const,
    text: label,
  };
  if (["steps", "heartRate", "battery"].includes(type))
    e.presentation = { ...presentation(e), variant: "value" };
  return e;
}
function graphic(
  type: "shape" | "progress" | "icon",
  id: string,
  variant: string,
  diameter: number,
  color: string,
  stroke: number,
  x = 227,
  y = 227,
): FaceElement {
  const e = { ...createElement(type, id), x, y, color };
  e.presentation = {
    ...presentation(e),
    variant,
    width: diameter,
    height: diameter,
    stroke,
  };
  return e;
}
function ring(
  id: string,
  diameter: number,
  color: string,
  source: "steps" | "activeMinutes" | "battery",
  goal: number,
) {
  const e = graphic("progress", id, "ring", diameter, color, 12);
  e.presentation = { ...presentation(e), source, goal };
  return e;
}
function preset(
  slug: string,
  name: string,
  description: string,
  elements: FaceElement[],
  background = "#000000",
): Preset {
  return {
    slug,
    name,
    description,
    compatibleDevices: ["fr970"],
    design: withPresetPowerLayouts(
      { ...defaultDesign(), name, background, elements },
      slug,
    ),
  };
}
const metrics = (color: string) => [
  graphic("icon", "steps-icon", "steps", 26, color, 3, 161, 280),
  graphic("icon", "heart-icon", "heart", 26, color, 3, 293, 280),
  text("steps", 161, 322, 32),
  text("heartRate", 293, 322, 32),
];
function hand(
  id: string,
  color: string,
  diameter: number,
  stroke: number,
  seconds = false,
) {
  const element = analogTime(text("time", 227, 227, 80, color), diameter);
  return {
    ...element,
    id,
    presentation: {
      ...presentation(element),
      variant: seconds ? "analog-seconds" : "analog",
      stroke,
    },
  };
}
export const retainedPresets: readonly Preset[] = [
  simplePreset,
  preset(
    "vital-rings",
    "Vital Rings",
    "Three live rings for steps, active minutes, and battery.",
    [
      graphic("shape", "outer-track", "circle", 454, "#28191C", 12),
      graphic("shape", "middle-track", "circle", 415, "#152A26", 12),
      graphic("shape", "inner-track", "circle", 376, "#142432", 12),
      ring("activity-ring", 454, "#FF6356", "activeMinutes", 60),
      ring("steps-ring", 415, "#49DCAB", "steps", 10000),
      ring("battery-ring", 376, "#00AEFF", "battery", 100),
      text("date", 227, 143, 24),
      { ...text("time", 227, 211, 80), family: "anton", weight: 400 },
      ...metrics("#49DCAB"),
    ],
    "#151D22",
  ),
  summitPreset,
  preset(
    "heritage-watch",
    "Heritage Watch",
    "A pale sage field dial, dark hour markers, luminous-style hands, and a red seconds accent.",
    [
      graphic("shape", "field-dial", "field-dial", 454, "#273B3C", 2),
      text("text", 227, 143, 24, "#273B3C", "TEMP C"),
      {
        ...text("weather", 227, 176, 32, "#273B3C"),
        presentation: {
          ...presentation(createElement("weather", "weather")),
          variant: "value",
        },
      },
      {
        ...text("date", 351, 227, 32, "#273B3C"),
        presentation: {
          ...presentation(createElement("date", "date")),
          variant: "day",
        },
      },
      text("text", 227, 290, 24, "#273B3C", "STEPS"),
      text("steps", 227, 328, 40, "#273B3C"),
      hand("seconds", "#A64F55", 370, 2, true),
      hand("hand-outline", "#273B3C", 370, 15),
      hand("hand-inlay", "#B8D1BD", 360, 7),
      graphic("shape", "hand-pivot", "circle", 12, "#A64F55", 6),
    ],
    "#C9D0C8",
  ),
];

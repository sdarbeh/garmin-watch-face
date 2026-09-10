import {
  createElement,
  defaultDesign,
  presentation,
  type FaceElement,
  type ElementType,
} from "../watchface/schema";

const ink = "#FFFFFF";
function layer(
  type: ElementType,
  id: string,
  x: number,
  y: number,
  size: FaceElement["size"],
  text = "",
): FaceElement {
  return {
    ...createElement(type, id),
    family: "doto",
    weight: 700,
    color: ink,
    x,
    y,
    size,
    text,
  };
}
const battery = layer("battery", "battery", 227, 50, 24);
battery.presentation = { ...presentation(battery), variant: "percentage" };
const date = layer("date", "date", 64, 124, 24);
date.alignment = "right";
date.presentation = { ...presentation(date), variant: "full" };
const time = layer("time", "time", 64, 176, 64);
time.timeFormat = "24";
time.presentation = { ...presentation(time), variant: "seconds" };
time.alignment = "right";
const rows: [ElementType, string, number][] = [
  ["heartRate", "HEART RATE", 236],
  ["steps", "STEPS", 292],
  ["bodyBattery", "BODY BATTERY", 318],
  ["recovery", "RECOVERY", 344],
];
export const dotMatrixDesign = {
  ...defaultDesign(),
  name: "Dot matrix",
  background: "#000000",
  elements: [
    battery,
    date,
    time,
    ...rows.flatMap(([type, label, y]) => {
      const title = layer("text", `${type}-label`, 64, y, 24, label);
      title.alignment = "right";
      const value = layer(type, type, 382, y, 24);
      value.alignment = "left";
      if (type !== "heartRate")
        value.presentation = { ...presentation(value), variant: "value" };
      return [title, value];
    }),
  ].reverse(),
};

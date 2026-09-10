import type { FaceElement } from "./schema";
import { presentation } from "./schema";

export const isAnalog = (variant: string) =>
  variant === "analog" || variant === "analog-seconds";
/** Fractions of the layer diameter, shared with the Garmin generator. */
export const HAND_LENGTHS = [0.29, 0.43, 0.46] as const;
export function analogLines(element: FaceElement, clock: string) {
  const [hour, minute, second = 0] = clock.split(":").map(Number);
  const p = presentation(element);
  const turns = [((hour % 12) + minute / 60) / 12, minute / 60];
  if (p.variant === "analog-seconds") turns.push(second / 60);
  return turns.map((turn, index) => {
    const angle = turn * Math.PI * 2;
    return [
      [element.x, element.y],
      [
        Math.round(element.x + Math.sin(angle) * p.width * HAND_LENGTHS[index]),
        Math.round(
          element.y - Math.cos(angle) * p.height * HAND_LENGTHS[index],
        ),
      ],
    ];
  });
}
export function analogTime(element: FaceElement, diameter = 350): FaceElement {
  return {
    ...element,
    x: 227,
    y: 227,
    presentation: {
      ...presentation(element),
      variant: "analog",
      width: diameter,
      height: diameter,
      stroke: 7,
    },
  };
}

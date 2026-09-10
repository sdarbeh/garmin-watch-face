"use client";
import { useEffect, useState } from "react";
import { WatchPreview } from "@/components/editor/canvas/WatchPreview";
import {
  createElement,
  defaultDesign,
  presentation,
  validateDesign,
} from "@/watchface/schema";
import { SAMPLE_DATA } from "@/watchface/render-model";

const blue = "#0088FF";
const hero = defaultDesign();
hero.name = "Studio run";
hero.elements = [];
const ring = createElement("progress", "hero-ring");
ring.color = blue;
ring.presentation = {
  ...presentation(ring),
  width: 400,
  height: 400,
  stroke: 10,
  source: "battery",
  goal: 100,
};
hero.elements.push(ring);
for (const [type, x, y, size] of [
  ["date", 227, 118, 32],
  ["time", 227, 202, 96],
  ["steps", 160, 318, 32],
  ["heartRate", 294, 318, 32],
] as const) {
  const element = createElement(type, `hero-${type}`);
  Object.assign(element, {
    x,
    y,
    size,
    family: "garmin",
    weight: 400,
    color: type === "date" ? blue : "#FFFFFF",
  });
  element.presentation = {
    ...presentation(element),
    variant: type === "steps" || type === "heartRate" ? "value" : "labeled",
  };
  hero.elements.push(element);
}
for (const [variant, x] of [
  ["steps", 160],
  ["heart", 294],
] as const) {
  const icon = createElement("icon", `hero-icon-${variant}`);
  Object.assign(icon, { x, y: 275, color: blue });
  icon.presentation = {
    ...presentation(icon),
    variant,
    width: 28,
    height: 28,
    stroke: 3,
  };
  hero.elements.push(icon);
}
const heroDesign = validateDesign(hero);
export function HeroWatch() {
  const [progress, setProgress] = useState(78);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const configure = () => {
      clearInterval(timer);
      if (!motion.matches)
        timer = setInterval(
          () => setProgress((value) => (value >= 85 ? 78 : value + 1)),
          1800,
        );
    };
    configure();
    motion.addEventListener("change", configure);
    return () => {
      clearInterval(timer);
      motion.removeEventListener("change", configure);
    };
  }, []);
  return (
    <WatchPreview
      design={heroDesign}
      selected={null}
      samples={{
        ...SAMPLE_DATA,
        time: "10:09",
        date: "TUE 9",
        steps: "8421 steps",
        battery: `${progress}% battery`,
      }}
    />
  );
}

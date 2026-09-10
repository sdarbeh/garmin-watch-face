import {
  createElement,
  presentation,
  validateDesign,
  type Design,
  type FaceElement,
} from "../watchface/schema";
import summit from "./assets/summit-night.json";
import starfield from "./assets/starfield-night.json";
import simple from "./assets/simple-dots-night.json";
import race from "./assets/race-circuit-night.json";
import trail from "./assets/trail-dashboard-night.json";
import lunar from "./assets/lunar-night.json";
import panda from "./assets/panda-night.json";
import heritage from "./assets/heritage-night.json";
const backgrounds: Record<string, string> = {
  summit,
  starfield,
  simple,
  "race-day": race,
  "trail-data": trail,
  lunar: lunar,
  panda,
  "heritage-watch": heritage,
};
function dimColor(color: string) {
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(color.slice(i, i + 2), 16) * 0.48)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
/** Preserve editable placement and bindings; swap only the night artwork and palette. */
export function withNightIdentity(design: Design, slug: string): Design {
  // A quiet punchline is more useful than a brightly burning room at night.
  if (slug === "this-is-fine") return design;
  const lightDial = ["simple", "panda", "heritage-watch"].includes(slug);
  const elements = design.elements.map((element): FaceElement => {
    const p = presentation(element);
    if (
      element.type === "image" ||
      (element.type === "shape" && ["dial", "field-dial"].includes(p.variant))
    ) {
      const image = backgrounds[slug];
      if (!image) return { ...element, visible: false };
      return {
        ...createElement("image", element.id),
        x: element.x,
        y: element.y,
        presentation: {
          ...p,
          variant: "image",
          image,
          width: 454,
          height: 454,
        },
      };
    }
    const color = lightDial ? "#82988B" : dimColor(element.color);
    return {
      ...element,
      color,
      presentation: {
        ...p,
        variant: p.variant === "analog-seconds" ? "analog" : p.variant,
      },
    };
  });
  return validateDesign({
    ...design,
    layouts: { ...design.layouts, night: { background: "#000000", elements } },
  });
}

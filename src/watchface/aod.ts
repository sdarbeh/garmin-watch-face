import type { Design } from "./schema";
import { presentation } from "./schema";
import { renderModel } from "./render-model";
import { isGraphic } from "./layer-catalog";
import { textWidth } from "./fonts";
/** Conservative sample-based estimate, not a substitute for Garmin's screen heat map.
 * Bounding boxes overcount sparse text and line art; images assume full white.
 */
export function estimateAodLuminance(layout: Design) {
  const area = Math.PI * (454 / 2) ** 2;
  const occupied = renderModel(layout, undefined, false).reduce((total, e) => {
    const p = presentation(e);
    const rectangle = isGraphic(e.type, p.variant)
      ? p.width * p.height
      : textWidth(e.sample, e.font) * e.font.height;
    const channels = [1, 3, 5].map(
      (offset) => parseInt(e.color.slice(offset, offset + 2), 16) / 255,
    );
    const brightness =
      e.type === "image"
        ? 1
        : Math.max(
            ...channels,
            ...(e.rules ?? [])
              .filter((r) => r.effect === "color")
              .flatMap((r) =>
                [1, 3, 5].map(
                  (offset) =>
                    parseInt(r.color.slice(offset, offset + 2), 16) / 255,
                ),
              ),
          );
    return total + rectangle * brightness;
  }, 0);
  return Math.min(1, occupied / area);
}

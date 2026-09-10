import { FONT_SIZES, TEXT_PLACEMENT } from "../../../watchface/fonts";
import { isGraphic } from "../../../watchface/layer-catalog";
import { presentation, type Design } from "../../../watchface/schema";
import { renderModel, SAMPLE_DATA } from "../../../watchface/render-model";
import { clampPosition, elementBounds } from "./geometry";

export const RESIZE_CORNERS = ["nw", "ne", "se", "sw"] as const;
export type ResizeCorner = (typeof RESIZE_CORNERS)[number];
export function cornerPoint(
  element: ReturnType<typeof renderModel>[number],
  corner: ResizeCorner,
) {
  const bounds = elementBounds(element);
  return {
    x: bounds.left + (corner.includes("e") ? bounds.width : 0),
    y: element.y + ((corner.includes("s") ? 1 : -1) * bounds.height) / 2,
  };
}
/** Resize from the opposite corner using watch pixels, independent of canvas zoom. */
export function resizeLayer(
  design: Design,
  id: string,
  corner: ResizeCorner,
  dx: number,
  dy: number,
  threshold: number,
  samples = SAMPLE_DATA,
) {
  const rendered = renderModel(design, samples);
  const element = rendered.find((e) => e.id === id);
  const guides: { axis: "x" | "y"; value: number }[] = [];
  if (!element || element.locked || (dx === 0 && dy === 0))
    return { design, guides };
  const original = elementBounds(element);
  const sx = corner.includes("e") ? 1 : -1;
  const sy = corner.includes("s") ? 1 : -1;
  const start = cornerPoint(element, corner);
  const anchor = {
    x: start.x - sx * original.width,
    y: start.y - sy * original.height,
  };
  const pointer = { x: start.x + dx, y: start.y + dy };
  const targets = { x: [227], y: [227] };
  for (const other of rendered.filter((e) => e.id !== id)) {
    const b = elementBounds(other);
    targets.x.push(b.left, b.centerX, b.left + b.width);
    targets.y.push(other.y - b.height / 2, other.y, other.y + b.height / 2);
  }
  for (const axis of ["x", "y"] as const) {
    const nearest = targets[axis].reduce((best, target) =>
      Math.abs(target - pointer[axis]) < Math.abs(best - pointer[axis])
        ? target
        : best,
    );
    if (threshold > 0 && Math.abs(nearest - pointer[axis]) <= threshold)
      pointer[axis] = nearest;
  }
  const requested = {
    width: Math.max(1, sx * (pointer.x - anchor.x)),
    height: Math.max(1, sy * (pointer.y - anchor.y)),
  };
  const p = presentation(element);
  const graphic = isGraphic(element.type, p.variant);
  let changed = design.elements.find((e) => e.id === id)!;
  let width: number;
  let height: number;
  if (graphic) {
    width = Math.max(8, Math.min(454, Math.round(requested.width)));
    height = Math.max(8, Math.min(454, Math.round(requested.height)));
    if (element.type === "image" || element.type === "icon") {
      const ratio =
        (requested.width * original.width +
          requested.height * original.height) /
        (original.width ** 2 + original.height ** 2);
      const bounded = Math.max(
        8 / Math.min(original.width, original.height),
        Math.min(454 / Math.max(original.width, original.height), ratio),
      );
      width = Math.round(original.width * bounded);
      height = Math.round(original.height * bounded);
    }
    changed = { ...changed, presentation: { ...p, width, height } };
  } else {
    // Use actual glyph metrics instead of assuming font size equals text height.
    const candidates = FONT_SIZES.map((size) => {
      const next = { ...changed, size };
      const bounds = elementBounds(
        renderModel({ ...design, elements: [next] }, samples)[0],
      );
      return {
        next,
        bounds,
        distance:
          (bounds.width - requested.width) ** 2 +
          (bounds.height - requested.height) ** 2,
      };
    });
    const best = candidates.reduce((a, b) =>
      a.distance <= b.distance ? a : b,
    );
    changed = best.next;
    width = best.bounds.width;
    height = best.bounds.height;
  }
  const centerX = anchor.x + (sx * width) / 2;
  changed = {
    ...changed,
    x: clampPosition(
      centerX -
        (graphic ? 0 : width * TEXT_PLACEMENT[changed.alignment].centerOffset),
    ),
    y: clampPosition(anchor.y + (sy * height) / 2),
  };
  const next = {
    ...design,
    elements: design.elements.map((e) => (e.id === id ? changed : e)),
  };
  const actual = cornerPoint(
    renderModel(next, samples).find((e) => e.id === id)!,
    corner,
  );
  if (threshold > 0)
    for (const axis of ["x", "y"] as const) {
      const target = targets[axis].find(
        (target) => Math.abs(target - actual[axis]) <= 0.5,
      );
      if (target !== undefined) guides.push({ axis, value: target });
    }
  return { design: next, guides };
}

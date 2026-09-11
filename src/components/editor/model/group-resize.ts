import { FONT_SIZES, TEXT_PLACEMENT } from "@/watchface/fonts";
import { isGraphic } from "@/watchface/layer-catalog";
import { presentation, type Design, type ElementId } from "@/watchface/schema";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
import { clampPosition, elementBounds } from "./geometry";
import { RESIZE_CORNERS, type ResizeCorner } from "./resize";
import { selectionBounds, type SelectionRect } from "./selection";

export function selectionCornerPoint(
  bounds: SelectionRect,
  corner: ResizeCorner,
) {
  return {
    x: corner.includes("e") ? bounds.x + bounds.width : bounds.x,
    y: corner.includes("s") ? bounds.y + bounds.height : bounds.y,
  };
}

/** Scales selected layers from the opposite group corner while preserving layout. */
export function resizeLayers(
  design: Design,
  ids: ElementId[],
  corner: ResizeCorner,
  dx: number,
  dy: number,
  threshold: number,
  samples = SAMPLE_DATA,
) {
  const guides: { axis: "x" | "y"; value: number }[] = [];
  const selected = new Set(ids);
  const sourceElements = design.elements.filter((element) =>
    selected.has(element.id),
  );
  if (
    !selected.size ||
    sourceElements.length !== selected.size ||
    sourceElements.some((element) => element.locked || !element.visible) ||
    (dx === 0 && dy === 0)
  )
    return { design, guides };

  const rendered = renderModel(design, samples);
  const renderedById = new Map(
    rendered.map((element) => [element.id, element]),
  );
  const bounds = selectionBounds(design, ids, samples);
  if (
    !bounds ||
    sourceElements.some((element) => !renderedById.has(element.id))
  )
    return { design, guides };

  const sx = corner.includes("e") ? 1 : -1;
  const sy = corner.includes("s") ? 1 : -1;
  const start = selectionCornerPoint(bounds, corner);
  const anchor = {
    x: start.x - sx * bounds.width,
    y: start.y - sy * bounds.height,
  };
  const pointer = { x: start.x + dx, y: start.y + dy };
  const targets = { x: [227], y: [227] };
  for (const other of rendered.filter((element) => !selected.has(element.id))) {
    const otherBounds = elementBounds(other);
    targets.x.push(
      otherBounds.left,
      otherBounds.centerX,
      otherBounds.left + otherBounds.width,
    );
    targets.y.push(
      other.y - otherBounds.height / 2,
      other.y,
      other.y + otherBounds.height / 2,
    );
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

  const requestedWidth = Math.max(1, sx * (pointer.x - anchor.x));
  const requestedHeight = Math.max(1, sy * (pointer.y - anchor.y));
  // Project the pointer onto the original diagonal to preserve group proportions.
  const factor = Math.max(
    0.05,
    Math.min(
      10,
      (requestedWidth * bounds.width + requestedHeight * bounds.height) /
        (bounds.width ** 2 + bounds.height ** 2),
    ),
  );
  if (Math.abs(factor - 1) < 0.0001) return { design, guides };

  const changed = sourceElements.map((source) => {
    const visual = renderedById.get(source.id)!;
    const original = elementBounds(visual);
    const desiredCenter = {
      x: anchor.x + (original.centerX - anchor.x) * factor,
      y: anchor.y + (visual.y - anchor.y) * factor,
    };
    const currentPresentation = presentation(source);
    const graphic = isGraphic(source.type, currentPresentation.variant);
    let next = source;
    let width: number;
    if (graphic) {
      width = Math.max(8, Math.min(454, Math.round(original.width * factor)));
      const height = Math.max(
        8,
        Math.min(454, Math.round(original.height * factor)),
      );
      next = {
        ...next,
        presentation: { ...currentPresentation, width, height },
      };
    } else {
      const targetSize = source.size * factor;
      const size = FONT_SIZES.reduce((best, candidate) =>
        Math.abs(candidate - targetSize) < Math.abs(best - targetSize)
          ? candidate
          : best,
      );
      next = { ...next, size };
      width = elementBounds(
        renderModel({ ...design, elements: [next] }, samples)[0],
      ).width;
    }
    return {
      ...next,
      x: clampPosition(
        desiredCenter.x -
          (graphic ? 0 : width * TEXT_PLACEMENT[next.alignment].centerOffset),
      ),
      y: clampPosition(desiredCenter.y),
    };
  });
  const changedById = new Map(changed.map((element) => [element.id, element]));
  let next = {
    ...design,
    elements: design.elements.map(
      (element) => changedById.get(element.id) ?? element,
    ),
  };
  const resizedBounds = selectionBounds(next, ids, samples);
  if (resizedBounds) {
    // Supported font sizes are discrete, so realign the fixed corner after sizing.
    const opposite =
      RESIZE_CORNERS[
        (RESIZE_CORNERS.indexOf(corner) + 2) % RESIZE_CORNERS.length
      ];
    const resizedAnchor = selectionCornerPoint(resizedBounds, opposite);
    const shift = {
      x: anchor.x - resizedAnchor.x,
      y: anchor.y - resizedAnchor.y,
    };
    next = {
      ...next,
      elements: next.elements.map((element) =>
        selected.has(element.id)
          ? {
              ...element,
              x: clampPosition(element.x + shift.x),
              y: clampPosition(element.y + shift.y),
            }
          : element,
      ),
    };
  }
  const actualBounds = selectionBounds(next, ids, samples);
  if (threshold > 0 && actualBounds) {
    const actual = selectionCornerPoint(actualBounds, corner);
    for (const axis of ["x", "y"] as const) {
      const target = targets[axis].find(
        (candidate) => Math.abs(candidate - actual[axis]) <= 0.5,
      );
      if (target !== undefined) guides.push({ axis, value: target });
    }
  }
  return { design: next, guides };
}

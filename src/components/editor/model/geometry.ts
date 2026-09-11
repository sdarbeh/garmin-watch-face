import { isGraphic } from "../../../watchface/layer-catalog";
import { presentation } from "../../../watchface/schema";
import { textWidth, TEXT_PLACEMENT } from "../../../watchface/fonts";
import { renderModel, SAMPLE_DATA } from "../../../watchface/render-model";
import type { Design, ElementId } from "../../../watchface/schema";
export const clampPosition = (value: number) =>
  Math.max(50, Math.min(404, Math.round(value)));
export function elementBounds(element: ReturnType<typeof renderModel>[number]) {
  if (isGraphic(element.type, presentation(element).variant)) {
    const { width, height } = presentation(element);
    return { width, height, centerX: element.x, left: element.x - width / 2 };
  }
  const width = textWidth(element.sample, element.font);
  const centerX =
    element.x + width * TEXT_PLACEMENT[element.alignment].centerOffset;
  return {
    width,
    height: element.font.height,
    centerX,
    left: centerX - width / 2,
  };
}
export function moveElement(
  design: Design,
  id: ElementId,
  x: number,
  y: number,
): Design {
  return {
    ...design,
    elements: design.elements.map((element) =>
      element.id === id && !element.locked && element.visible
        ? { ...element, x: clampPosition(x), y: clampPosition(y) }
        : element,
    ),
  };
}

/** Moves a selection as one group and preserves spacing at canvas edges. */
export function moveElementsBy(
  design: Design,
  ids: ElementId[],
  dx: number,
  dy: number,
): Design {
  const idsSet = new Set(ids);
  const requested = design.elements.filter((element) => idsSet.has(element.id));
  if (requested.some((element) => element.locked)) return design;
  const selected = design.elements.filter(
    (element) => idsSet.has(element.id) && !element.locked && element.visible,
  );
  if (!selected.length) return design;
  const requestedX = Math.round(dx);
  const requestedY = Math.round(dy);
  const appliedX = Math.max(
    50 - Math.min(...selected.map((element) => element.x)),
    Math.min(
      404 - Math.max(...selected.map((element) => element.x)),
      requestedX,
    ),
  );
  const appliedY = Math.max(
    50 - Math.min(...selected.map((element) => element.y)),
    Math.min(
      404 - Math.max(...selected.map((element) => element.y)),
      requestedY,
    ),
  );
  const selectedSet = new Set(selected.map((element) => element.id));
  return {
    ...design,
    elements: design.elements.map((element) =>
      selectedSet.has(element.id)
        ? { ...element, x: element.x + appliedX, y: element.y + appliedY }
        : element,
    ),
  };
}
export function snapPosition(
  design: Design,
  id: ElementId,
  x: number,
  y: number,
  threshold: number,
  samples = SAMPLE_DATA,
  excludedIds: ElementId[] = [id],
) {
  const elements = renderModel(design, samples);
  const moving = elements.find((element) => element.id === id);
  if (!moving) return { x: clampPosition(x), y: clampPosition(y), guides: [] };
  const bounds = elementBounds(moving);
  const guides: { axis: "x" | "y"; value: number }[] = [];
  const position = { x: clampPosition(x), y: clampPosition(y) };
  for (const axis of ["x", "y"] as const) {
    const half = (axis === "x" ? bounds.width : bounds.height) / 2;
    const targets = [227];
    for (const other of elements.filter(
      (element) => !excludedIds.includes(element.id),
    )) {
      const size = elementBounds(other);
      const extent = (axis === "x" ? size.width : size.height) / 2;
      const center = axis === "x" ? size.centerX : other.y;
      targets.push(center, center - extent, center + extent);
    }
    let distance = threshold;
    let result = position[axis];
    let guide: number | undefined;
    for (const offset of [0, -half, half].map(
      (value) => value + (axis === "x" ? bounds.centerX - moving.x : 0),
    ))
      for (const target of targets) {
        const candidate = Math.round(target - offset);
        const delta = Math.abs(candidate - position[axis]);
        if (delta <= distance && candidate >= 50 && candidate <= 404) {
          result = candidate;
          distance = delta;
          guide = target;
        }
      }
    position[axis] = result;
    if (guide !== undefined) guides.push({ axis, value: guide });
  }
  return { ...position, guides };
}

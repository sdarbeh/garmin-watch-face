import { defaultMetricRules } from "@/watchface/default-rules";
import type { PowerMode } from "@/watchface/power";
import {
  createElement,
  MAX_ELEMENTS,
  type Design,
  type ElementType,
} from "@/watchface/schema";
import { clampPosition } from "./geometry";

const DUPLICATE_OFFSET = 12;

function offsetDuplicate(value: number) {
  const forward = clampPosition(value + DUPLICATE_OFFSET);
  if (forward - value === DUPLICATE_OFFSET) return forward;
  return clampPosition(value - DUPLICATE_OFFSET);
}

export function addLayer(
  design: Design,
  type: ElementType,
  id: string,
  mode: PowerMode = "normal",
): Design {
  if (design.elements.length >= MAX_ELEMENTS) return design;
  // The panel reverses draw order; inserting first places the layer above Background.
  const rules =
    mode === "always-on"
      ? []
      : defaultMetricRules(
          type === "progress" ? "steps" : type,
          mode === "night",
        );
  const element = {
    ...createElement(type, id),
    ...(rules.length ? { rules } : {}),
  };
  return { ...design, elements: [element, ...design.elements] };
}
export function duplicateLayer(
  design: Design,
  source: string,
  id: string,
): Design {
  const element = design.elements.find((item) => item.id === source);
  if (!element || element.locked || design.elements.length >= MAX_ELEMENTS)
    return design;
  const elements = [...design.elements];
  elements.splice(elements.indexOf(element) + 1, 0, {
    ...element,
    id,
    locked: false,
    x: offsetDuplicate(element.x),
    y: offsetDuplicate(element.y),
  });
  return { ...design, elements };
}
export function reorderLayer(
  design: Design,
  id: string,
  placement: -1 | 1 | "front" | "back",
): Design {
  const elements = [...design.elements];
  const index = elements.findIndex((item) => item.id === id);
  let next = index;
  if (placement === "front") next = elements.length - 1;
  else if (placement === "back") next = 0;
  else next = index + placement;
  if (
    index < 0 ||
    elements[index].locked ||
    next === index ||
    next < 0 ||
    next >= elements.length
  )
    return design;
  const [element] = elements.splice(index, 1);
  elements.splice(next, 0, element);
  return { ...design, elements };
}

export function reorderLayers(
  design: Design,
  ids: string[],
  placement: -1 | 1 | "front" | "back",
): Design {
  const selected = new Set(ids);
  if (!selected.size) return design;
  const layers = design.elements.filter((element) => selected.has(element.id));
  if (
    layers.length !== selected.size ||
    layers.some((element) => element.locked)
  )
    return design;
  const elements = [...design.elements];
  if (placement === "front" || placement === "back") {
    const unselected = elements.filter((element) => !selected.has(element.id));
    const reordered =
      placement === "front"
        ? [...unselected, ...layers]
        : [...layers, ...unselected];
    if (reordered.every((element, index) => element.id === elements[index].id))
      return design;
    return {
      ...design,
      elements: reordered,
    };
  }
  if (placement === 1) {
    for (let index = elements.length - 2; index >= 0; index -= 1) {
      if (
        selected.has(elements[index].id) &&
        !selected.has(elements[index + 1].id)
      )
        [elements[index], elements[index + 1]] = [
          elements[index + 1],
          elements[index],
        ];
    }
  } else {
    for (let index = 1; index < elements.length; index += 1) {
      if (
        selected.has(elements[index].id) &&
        !selected.has(elements[index - 1].id)
      )
        [elements[index], elements[index - 1]] = [
          elements[index - 1],
          elements[index],
        ];
    }
  }
  if (
    elements.every((element, index) => element.id === design.elements[index].id)
  )
    return design;
  return { ...design, elements };
}

/** Places a layer selection directly above or below another layer. */
export function placeLayers(
  design: Design,
  ids: string[],
  targetId: string,
  placement: "above" | "below",
): Design {
  const selected = new Set(ids);
  if (!selected.size || selected.has(targetId)) return design;
  const moving = design.elements.filter((element) => selected.has(element.id));
  if (
    moving.length !== selected.size ||
    moving.some((element) => element.locked)
  )
    return design;
  const remaining = design.elements.filter(
    (element) => !selected.has(element.id),
  );
  const targetIndex = remaining.findIndex((element) => element.id === targetId);
  if (targetIndex < 0) return design;
  const insertionIndex = targetIndex + (placement === "above" ? 1 : 0);
  const elements = [
    ...remaining.slice(0, insertionIndex),
    ...moving,
    ...remaining.slice(insertionIndex),
  ];
  if (
    elements.every((element, index) => element.id === design.elements[index].id)
  )
    return design;
  return { ...design, elements };
}

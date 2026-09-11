import { defaultMetricRules } from "../../../watchface/default-rules";
import type { PowerMode } from "../../../watchface/power";
import {
  createElement,
  MAX_ELEMENTS,
  type Design,
  type ElementType,
} from "../../../watchface/schema";
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

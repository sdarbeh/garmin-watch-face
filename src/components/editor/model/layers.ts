import { defaultMetricRules } from "../../../watchface/default-rules";
import type { PowerMode } from "../../../watchface/power";
import {
  createElement,
  MAX_ELEMENTS,
  type Design,
  type ElementType,
} from "../../../watchface/schema";
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
  });
  return { ...design, elements };
}
export function reorderLayer(
  design: Design,
  id: string,
  direction: -1 | 1,
): Design {
  const elements = [...design.elements];
  const index = elements.findIndex((item) => item.id === id);
  const next = index + direction;
  if (
    index < 0 ||
    elements[index].locked ||
    next < 0 ||
    next >= elements.length
  )
    return design;
  [elements[index], elements[next]] = [elements[next], elements[index]];
  return { ...design, elements };
}

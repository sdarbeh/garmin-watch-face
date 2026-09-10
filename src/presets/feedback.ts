import {
  presentation,
  validateDesign,
  type Design,
  type FaceElement,
} from "../watchface/schema";
import { defaultMetricRules } from "../watchface/default-rules";

/** Preset feedback is ordinary editable rules, not special rendering behavior. */
export function withMetricFeedback(design: Design): Design {
  function apply(elements: FaceElement[], night = false): FaceElement[] {
    return elements.map((element) => {
      const p = presentation(element);
      const source = element.type === "progress" ? p.source : element.type;
      const rules = defaultMetricRules(source, night);
      return rules.length && element.rules === undefined
        ? { ...element, rules }
        : element;
    });
  }
  return validateDesign({
    ...design,
    elements: apply(design.elements),
    layouts: {
      ...design.layouts,
      ...(design.layouts?.night
        ? {
            night: {
              ...design.layouts.night,
              elements: apply(design.layouts.night.elements, true),
            },
          }
        : {}),
      ...(design.layouts?.["low-battery"]
        ? {
            "low-battery": {
              ...design.layouts["low-battery"],
              elements: apply(design.layouts["low-battery"].elements),
            },
          }
        : {}),
    },
  });
}

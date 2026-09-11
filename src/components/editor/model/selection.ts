import { renderModel, SAMPLE_DATA } from "../../../watchface/render-model";
import type { Design, ElementId } from "../../../watchface/schema";
import { elementBounds } from "./geometry";
import type { EditorPoint } from "../types";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MarqueeSelectionMode = "replace" | "add" | "toggle";

export function selectionRect(
  start: EditorPoint,
  end: EditorPoint,
): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function layersInSelection(
  design: Design,
  rect: SelectionRect,
  samples = SAMPLE_DATA,
): ElementId[] {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  return renderModel(design, samples)
    .filter((element) => {
      if (element.locked) return false;
      const bounds = elementBounds(element);
      const top = element.y - bounds.height / 2;
      return (
        bounds.left <= right &&
        bounds.left + bounds.width >= rect.x &&
        top <= bottom &&
        top + bounds.height >= rect.y
      );
    })
    .map((element) => element.id);
}

export function mergeMarqueeSelection(
  selected: ElementId[],
  hits: ElementId[],
  mode: MarqueeSelectionMode,
): ElementId[] {
  if (mode === "replace") return hits;
  if (mode === "add") return [...new Set([...selected, ...hits])];
  const toggled = new Set(selected);
  for (const id of hits) {
    if (toggled.has(id)) toggled.delete(id);
    else toggled.add(id);
  }
  return [...toggled];
}

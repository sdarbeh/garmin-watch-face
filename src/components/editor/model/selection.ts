import { renderModel, SAMPLE_DATA } from "../../../watchface/render-model";
import type {
  Design,
  ElementId,
  ElementType,
  FaceElement,
} from "../../../watchface/schema";
import { elementBounds } from "./geometry";
import type { EditorPoint, EditorSelection } from "../types";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MarqueeSelectionMode = "replace" | "add" | "toggle";

export interface LayerSelectionState {
  primary: FaceElement;
  ids: ElementId[];
  elements: FaceElement[];
  multiple: boolean;
  locked: boolean;
  allVisible: boolean;
  atFront: boolean;
  atBack: boolean;
}

export interface ModeSelectionSnapshot {
  selected: EditorSelection;
  selectedIds: ElementId[];
}

/** Restores valid IDs or chooses an equivalent first selection for a new mode. */
export function resolveModeSelection(
  design: Design,
  remembered?: ModeSelectionSnapshot,
  fallbackType?: ElementType,
): ModeSelectionSnapshot {
  if (remembered) {
    const selectedIds = remembered.selectedIds.filter((id) =>
      design.elements.some((element) => element.id === id),
    );
    const selected = selectedIds.includes(remembered.selected)
      ? remembered.selected
      : (selectedIds.at(-1) ?? "background");
    return { selected, selectedIds };
  }
  const fallback =
    design.elements.find((element) => element.type === fallbackType) ??
    design.elements.at(-1);
  return fallback
    ? { selected: fallback.id, selectedIds: [fallback.id] }
    : { selected: "background", selectedIds: [] };
}

/** Resolves one layer or its active multi-selection in document order. */
export function layerSelectionState(
  design: Design,
  target: ElementId,
  selectedIds: ElementId[] = [],
): LayerSelectionState | null {
  const primary = design.elements.find((element) => element.id === target);
  if (!primary) return null;
  const targetIds = new Set(
    selectedIds.includes(target) ? selectedIds : [target],
  );
  const elements = design.elements.filter((element) =>
    targetIds.has(element.id),
  );
  const ids = elements.map((element) => element.id);
  const indices = elements.map((element) => design.elements.indexOf(element));
  return {
    primary,
    ids,
    elements,
    multiple: elements.length > 1,
    locked: elements.some((element) => element.locked),
    allVisible: elements.every((element) => element.visible),
    atFront: indices.every(
      (index) => index >= design.elements.length - elements.length,
    ),
    atBack: indices.every((index) => index < elements.length),
  };
}

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

export function selectionBounds(
  design: Design,
  ids: ElementId[],
  samples = SAMPLE_DATA,
): SelectionRect | null {
  const selected = new Set(ids);
  const bounds = renderModel(design, samples)
    .filter((element) => selected.has(element.id))
    .map((element) => {
      const size = elementBounds(element);
      return {
        left: size.left,
        right: size.left + size.width,
        top: element.y - size.height / 2,
        bottom: element.y + size.height / 2,
      };
    });
  if (!bounds.length) return null;
  const x = Math.min(...bounds.map((item) => item.left));
  const y = Math.min(...bounds.map((item) => item.top));
  return {
    x,
    y,
    width: Math.max(...bounds.map((item) => item.right)) - x,
    height: Math.max(...bounds.map((item) => item.bottom)) - y,
  };
}

export function pointInsideRect(point: EditorPoint, rect: SelectionRect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
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

import {
  powerLayout,
  updateModeLayout,
  type PowerMode,
} from "../../../watchface/power";
import {
  validateDesign,
  MAX_ELEMENTS,
  type Design,
  type ElementId,
  type ElementType,
  type FaceElement,
} from "../../../watchface/schema";
import type { EditorPoint, EditorSelection } from "../types";
import { moveElement, moveElementsBy } from "./geometry";
import {
  addLayer,
  duplicateLayer,
  reorderLayer,
  reorderLayers,
} from "./layers";
import { nextPastePosition, placeClipboardElements } from "./clipboard";

export type EditorLayerPatch = Omit<Partial<FaceElement>, "id" | "type">;

export type EditorCommand =
  | { type: "layer.add"; layerType: ElementType }
  | { type: "layer.duplicate"; id: ElementId }
  | { type: "layer.duplicate-many"; ids: ElementId[] }
  | {
      type: "layer.paste";
      elements: FaceElement[];
      anchor: EditorPoint;
      position: EditorPoint;
    }
  | { type: "layer.delete"; id: ElementId }
  | { type: "layer.delete-many"; ids: ElementId[] }
  | {
      type: "layer.reorder";
      id: ElementId;
      placement: "forward" | "backward" | "front" | "back";
    }
  | {
      type: "layer.reorder-many";
      ids: ElementId[];
      placement: "forward" | "backward" | "front" | "back";
    }
  | { type: "layer.toggle-visibility"; id: ElementId }
  | { type: "layer.toggle-lock"; id: ElementId }
  | { type: "layer.update"; id: ElementId; patch: EditorLayerPatch }
  | { type: "layer.update-many"; ids: ElementId[]; patch: EditorLayerPatch }
  | { type: "layer.set-visibility"; ids: ElementId[]; visible: boolean }
  | { type: "layer.set-lock"; ids: ElementId[]; locked: boolean }
  | { type: "layer.move"; id: ElementId; x: number; y: number }
  | { type: "layer.move-many"; ids: ElementId[]; dx: number; dy: number }
  | { type: "project.reset"; initialDesign: Design };

export type DispatchEditorCommand = (
  command: EditorCommand,
) => EditorCommandResult | null;

export interface EditorCommandResult {
  design: Design;
  selection?: EditorSelection;
  selections?: ElementId[];
}

const REORDER_PLACEMENT = {
  forward: 1,
  backward: -1,
  front: "front",
  back: "back",
} as const;

function resolveCommandLayers(design: Design, ids: ElementId[]) {
  const selected = new Set(ids);
  const elements = design.elements.filter((element) =>
    selected.has(element.id),
  );
  return {
    selected,
    elements,
    complete: selected.size > 0 && elements.length === selected.size,
  };
}

function updateLayer(
  design: Design,
  id: ElementId,
  update: (element: FaceElement) => FaceElement,
  allowLocked = false,
) {
  const element = design.elements.find((item) => item.id === id);
  if (!element || (element.locked && !allowLocked)) return design;
  return {
    ...design,
    elements: design.elements.map((item) =>
      item.id === id ? update(item) : item,
    ),
  };
}

function updateLayers(
  design: Design,
  ids: ElementId[],
  update: (element: FaceElement) => FaceElement,
  allowLocked = false,
) {
  const selection = resolveCommandLayers(design, ids);
  if (
    !selection.complete ||
    (!allowLocked && selection.elements.some((element) => element.locked))
  )
    return design;
  return {
    ...design,
    elements: design.elements.map((element) =>
      selection.selected.has(element.id) ? update(element) : element,
    ),
  };
}

function unsupportedCommand(command: never): never {
  throw new Error(`Unsupported editor command: ${JSON.stringify(command)}`);
}

/**
 * Applies one editor intent to the full project. UI surfaces dispatch commands;
 * this function owns active-mode mapping, validation, IDs, and selection changes.
 */
export function executeEditorCommand(
  project: Design,
  mode: PowerMode,
  command: EditorCommand,
  createId: () => string = () => crypto.randomUUID(),
): EditorCommandResult {
  if (command.type === "project.reset") {
    return {
      design: validateDesign(command.initialDesign),
      selection: "background",
    };
  }

  const active = powerLayout(project, mode);
  let edited = active;
  let selection: EditorSelection | undefined;
  let selections: ElementId[] | undefined;

  switch (command.type) {
    case "layer.add": {
      const id = createId();
      edited = addLayer(active, command.layerType, id, mode);
      if (edited !== active) selection = id;
      break;
    }
    case "layer.duplicate": {
      const id = createId();
      edited = duplicateLayer(active, command.id, id);
      if (edited !== active) selection = id;
      break;
    }
    case "layer.duplicate-many": {
      const group = resolveCommandLayers(active, command.ids);
      if (
        !group.complete ||
        active.elements.length + group.elements.length > MAX_ELEMENTS ||
        group.elements.some((element) => element.locked)
      )
        break;
      const sources = group.elements;
      const anchor = {
        x:
          sources.reduce((sum, element) => sum + element.x, 0) / sources.length,
        y:
          sources.reduce((sum, element) => sum + element.y, 0) / sources.length,
      };
      const copies = placeClipboardElements(
        sources,
        anchor,
        nextPastePosition(anchor),
      ).map((source) => ({ ...source, id: createId(), locked: false }));
      edited = { ...active, elements: [...active.elements, ...copies] };
      selections = copies.map((element) => element.id);
      selection = selections.at(-1);
      break;
    }
    case "layer.paste": {
      if (
        !command.elements.length ||
        active.elements.length + command.elements.length > MAX_ELEMENTS
      )
        break;
      const placed = placeClipboardElements(
        command.elements,
        command.anchor,
        command.position,
      );
      const pasted = placed.map((source) => ({
        ...source,
        id: createId(),
        locked: false,
      }));
      edited = { ...active, elements: [...active.elements, ...pasted] };
      selection = pasted.at(-1)?.id;
      selections = pasted.map((element) => element.id);
      break;
    }
    case "layer.delete": {
      const element = active.elements.find((item) => item.id === command.id);
      if (!element || element.locked) break;
      edited = {
        ...active,
        elements: active.elements.filter((item) => item.id !== command.id),
      };
      selection = "background";
      break;
    }
    case "layer.delete-many": {
      const group = resolveCommandLayers(active, command.ids);
      if (!group.complete || group.elements.some((element) => element.locked))
        break;
      edited = {
        ...active,
        elements: active.elements.filter(
          (element) => !group.selected.has(element.id),
        ),
      };
      selection = "background";
      break;
    }
    case "layer.reorder": {
      edited = reorderLayer(
        active,
        command.id,
        REORDER_PLACEMENT[command.placement],
      );
      break;
    }
    case "layer.reorder-many": {
      edited = reorderLayers(
        active,
        command.ids,
        REORDER_PLACEMENT[command.placement],
      );
      break;
    }
    case "layer.toggle-visibility":
      edited = updateLayer(active, command.id, (element) => ({
        ...element,
        visible: !element.visible,
      }));
      break;
    case "layer.toggle-lock":
      edited = updateLayer(
        active,
        command.id,
        (element) => ({ ...element, locked: !element.locked }),
        true,
      );
      break;
    case "layer.update":
      edited = updateLayer(active, command.id, (element) => ({
        ...element,
        ...command.patch,
        id: element.id,
        type: element.type,
      }));
      break;
    case "layer.update-many": {
      edited = updateLayers(active, command.ids, (element) => ({
        ...element,
        ...command.patch,
        id: element.id,
        type: element.type,
      }));
      break;
    }
    case "layer.set-visibility":
      edited = updateLayers(active, command.ids, (element) => ({
        ...element,
        visible: command.visible,
      }));
      break;
    case "layer.set-lock":
      edited = updateLayers(
        active,
        command.ids,
        (element) => ({ ...element, locked: command.locked }),
        true,
      );
      break;
    case "layer.move":
      edited = moveElement(active, command.id, command.x, command.y);
      break;
    case "layer.move-many":
      edited = moveElementsBy(active, command.ids, command.dx, command.dy);
      break;
    default:
      return unsupportedCommand(command);
  }

  if (edited === active) return { design: project };
  const design = updateModeLayout(project, mode, validateDesign(edited));
  return {
    design: validateDesign(design),
    ...(selection ? { selection } : {}),
    ...(selections?.length ? { selections } : {}),
  };
}

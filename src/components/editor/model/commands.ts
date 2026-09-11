import {
  powerLayout,
  updateModeLayout,
  type PowerMode,
} from "../../../watchface/power";
import {
  validateDesign,
  type Design,
  type ElementId,
  type ElementType,
  type FaceElement,
} from "../../../watchface/schema";
import type { EditorSelection } from "../types";
import { moveElement } from "./geometry";
import { addLayer, duplicateLayer, reorderLayer } from "./layers";

export type EditorLayerPatch = Omit<Partial<FaceElement>, "id" | "type">;

export type EditorCommand =
  | { type: "layer.add"; layerType: ElementType }
  | { type: "layer.duplicate"; id: ElementId }
  | { type: "layer.delete"; id: ElementId }
  | { type: "layer.reorder"; id: ElementId; direction: -1 | 1 }
  | { type: "layer.toggle-visibility"; id: ElementId }
  | { type: "layer.toggle-lock"; id: ElementId }
  | { type: "layer.update"; id: ElementId; patch: EditorLayerPatch }
  | { type: "layer.move"; id: ElementId; x: number; y: number }
  | { type: "project.reset"; initialDesign: Design };

export type DispatchEditorCommand = (
  command: EditorCommand,
) => EditorCommandResult | null;

export interface EditorCommandResult {
  design: Design;
  selection?: EditorSelection;
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
    return { design: validateDesign(command.initialDesign) };
  }

  const active = powerLayout(project, mode);
  let edited = active;
  let selection: EditorSelection | undefined;

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
    case "layer.reorder":
      edited = reorderLayer(active, command.id, command.direction);
      break;
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
    case "layer.move":
      edited = moveElement(active, command.id, command.x, command.y);
      break;
    default:
      return unsupportedCommand(command);
  }

  if (edited === active) return { design: project };
  const design = updateModeLayout(project, mode, validateDesign(edited));
  return {
    design: validateDesign(design),
    ...(selection ? { selection } : {}),
  };
}

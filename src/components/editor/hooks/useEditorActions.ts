import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { browserLibrary } from "../../../library/store";
import { powerLayout, type PowerMode } from "../../../watchface/power";
import { MAX_ELEMENTS, type FaceElement } from "../../../watchface/schema";
import type { DispatchEditorCommand } from "../model/commands";
import { nextPastePosition } from "../model/clipboard";
import {
  editorShortcut,
  type EditorAction,
  type EditorShortcut,
} from "../model/shortcuts";
import { layerLabel, type EditorPoint, type EditorSelection } from "../types";
import {
  layerSelectionState,
  type LayerSelectionState,
} from "../model/selection";

const ARRANGE_PLACEMENTS: Partial<
  Record<EditorShortcut, "forward" | "backward" | "front" | "back">
> = {
  "bring-forward": "forward",
  "send-backward": "backward",
  "bring-front": "front",
  "send-back": "back",
};

interface LayerClipboard {
  elements: FaceElement[];
  anchor: EditorPoint;
  pasteCount: number;
}

export function useEditorActions({
  projectId,
  mode,
  selected,
  selectedIds,
  preview,
  onCommand,
  onMessage,
}: {
  projectId: string;
  mode: PowerMode;
  selected: EditorSelection;
  selectedIds: string[];
  preview: boolean;
  onCommand: DispatchEditorCommand;
  onMessage: (message: string) => void;
}) {
  const [clipboard, setClipboard] = useState<LayerClipboard | null>(null);
  const lastCanvasPoint = useRef<EditorPoint | null>(null);

  function currentSelection(target: EditorSelection) {
    const current = browserLibrary.find(projectId)?.design;
    if (!current || target === "background") return null;
    return layerSelectionState(powerLayout(current, mode), target, selectedIds);
  }

  function copyElements(selection: LayerSelectionState) {
    const { elements, primary } = selection;
    const anchor = {
      x: elements.reduce((sum, item) => sum + item.x, 0) / elements.length,
      y: elements.reduce((sum, item) => sum + item.y, 0) / elements.length,
    };
    setClipboard({
      elements: structuredClone(elements),
      anchor,
      pasteCount: 0,
    });
    onMessage(
      elements.length === 1
        ? `Copied ${layerLabel(primary)}`
        : `Copied ${elements.length} layers`,
    );
  }

  function paste(position?: EditorPoint) {
    const copied = clipboard;
    if (!copied) return false;
    const destination =
      position ??
      lastCanvasPoint.current ??
      nextPastePosition(copied.anchor, copied.pasteCount);
    const result = onCommand({
      type: "layer.paste",
      elements: copied.elements,
      anchor: copied.anchor,
      position: destination,
    });
    if (!result) return true;
    if (result.selection) {
      setClipboard({ ...copied, pasteCount: copied.pasteCount + 1 });
      onMessage(
        copied.elements.length === 1
          ? `Pasted ${layerLabel(copied.elements[0])}`
          : `Pasted ${copied.elements.length} layers`,
      );
    } else {
      onMessage("The layer limit has been reached.");
    }
    return true;
  }

  function run(
    action: EditorAction,
    target: EditorSelection = selected,
    pastePosition?: EditorPoint,
  ) {
    if (preview) return false;
    if (action === "paste") return paste(pastePosition);

    const selection = currentSelection(target);
    if (!selection) return false;
    const { primary, ids: targets, elements: targetElements } = selection;
    if (action === "copy") {
      copyElements(selection);
      return true;
    }
    if (action === "toggle-lock") {
      if (targets.length === 1) {
        onCommand({ type: "layer.toggle-lock", id: primary.id });
      } else {
        onCommand({
          type: "layer.set-lock",
          ids: targets,
          locked: !selection.locked,
        });
      }
      return true;
    }
    const locked = targetElements.find((item) => item.locked);
    if (locked) {
      onMessage(
        targets.length > 1
          ? "Unlock the selected layers to edit them."
          : `Unlock ${layerLabel(locked)} to edit it.`,
      );
      return true;
    }

    if (action === "cut") {
      copyElements(selection);
      onCommand({ type: "layer.delete-many", ids: targets });
      return true;
    }
    if (action === "duplicate") {
      if (targets.length === 1)
        onCommand({ type: "layer.duplicate", id: primary.id });
      else onCommand({ type: "layer.duplicate-many", ids: targets });
      return true;
    }
    if (action === "delete") {
      onCommand({ type: "layer.delete-many", ids: targets });
      return true;
    }
    if (action === "toggle-visibility") {
      if (targets.length === 1) {
        onCommand({ type: "layer.toggle-visibility", id: primary.id });
      } else {
        onCommand({
          type: "layer.set-visibility",
          ids: targets,
          visible: !selection.allVisible,
        });
      }
      return true;
    }

    const placement = ARRANGE_PLACEMENTS[action];
    if (!placement) return false;
    if (targets.length === 1)
      onCommand({ type: "layer.reorder", id: primary.id, placement });
    else onCommand({ type: "layer.reorder-many", ids: targets, placement });
    return true;
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const action = editorShortcut(event);
    if (!action || preview) return false;
    const textSelection = window.getSelection();
    if (
      (action === "copy" || action === "cut") &&
      textSelection &&
      !textSelection.isCollapsed
    )
      return false;
    if (event.repeat) {
      event.preventDefault();
      return true;
    }
    if (action === "paste" && !clipboard) return false;
    if (action !== "paste" && !currentSelection(selected)) return false;
    event.preventDefault();
    return run(action);
  }

  return {
    get canPaste() {
      const current = browserLibrary.find(projectId)?.design;
      if (!clipboard || !current) return false;
      return (
        powerLayout(current, mode).elements.length +
          clipboard.elements.length <=
        MAX_ELEMENTS
      );
    },
    onKeyDown,
    run,
    rememberCanvasPoint: (point: EditorPoint) => {
      lastCanvasPoint.current = point;
    },
  };
}

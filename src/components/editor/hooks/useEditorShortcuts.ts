import { useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { browserLibrary } from "../../../library/store";
import { powerLayout, type PowerMode } from "../../../watchface/power";
import type { FaceElement } from "../../../watchface/schema";
import type { DispatchEditorCommand } from "../model/commands";
import { editorShortcut, type EditorShortcut } from "../model/shortcuts";
import { layerLabel, type EditorSelection } from "../types";

const ARRANGE_PLACEMENTS: Partial<
  Record<EditorShortcut, "forward" | "backward" | "front" | "back">
> = {
  "bring-forward": "forward",
  "send-backward": "backward",
  "bring-front": "front",
  "send-back": "back",
};

interface LayerClipboard {
  element: FaceElement;
  pasteCount: number;
}

export function useEditorShortcuts({
  projectId,
  mode,
  selected,
  preview,
  onCommand,
  onMessage,
}: {
  projectId: string;
  mode: PowerMode;
  selected: EditorSelection;
  preview: boolean;
  onCommand: DispatchEditorCommand;
  onMessage: (message: string) => void;
}) {
  const clipboard = useRef<LayerClipboard | null>(null);

  function currentElement() {
    const current = browserLibrary.find(projectId)?.design;
    if (!current || selected === "background") return null;
    return powerLayout(current, mode).elements.find(
      (element) => element.id === selected,
    );
  }

  function copyElement(element: FaceElement) {
    clipboard.current = {
      element: structuredClone(element),
      pasteCount: 0,
    };
    onMessage(`Copied ${layerLabel(element)}`);
  }

  function arrange(shortcut: EditorShortcut) {
    const placement = ARRANGE_PLACEMENTS[shortcut];
    if (!placement || selected === "background") return false;
    onCommand({ type: "layer.reorder", id: selected, placement });
    return true;
  }

  function paste(copied: LayerClipboard) {
    const result = onCommand({
      type: "layer.paste",
      element: copied.element,
      offset: (copied.pasteCount + 1) * 12,
    });
    if (result?.selection) {
      copied.pasteCount += 1;
      onMessage(`Pasted ${layerLabel(copied.element)}`);
    } else if (result) {
      onMessage("The layer limit has been reached.");
    }
  }

  return (event: ReactKeyboardEvent<HTMLElement>) => {
    const shortcut = editorShortcut(event);
    if (!shortcut || preview) return false;
    const textSelection = window.getSelection();
    if (
      (shortcut === "copy" || shortcut === "cut") &&
      textSelection &&
      !textSelection.isCollapsed
    )
      return false;
    if (event.repeat) {
      event.preventDefault();
      return true;
    }

    if (shortcut === "paste") {
      if (!clipboard.current) return false;
      event.preventDefault();
      paste(clipboard.current);
      return true;
    }

    const element = currentElement();
    if (!element) return false;
    event.preventDefault();
    if (shortcut === "copy") {
      copyElement(element);
      return true;
    }
    if (element.locked) {
      onMessage(`Unlock ${layerLabel(element)} to edit it.`);
      return true;
    }
    if (shortcut === "cut") {
      copyElement(element);
      onCommand({ type: "layer.delete", id: element.id });
      return true;
    }
    if (shortcut === "duplicate") {
      onCommand({ type: "layer.duplicate", id: element.id });
      return true;
    }
    if (shortcut === "delete") {
      onCommand({ type: "layer.delete", id: element.id });
      return true;
    }
    return arrange(shortcut);
  };
}

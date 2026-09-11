import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { EditorPoint, EditorSelection } from "../types";
import type { EditorAction } from "./shortcuts";
import { layerSelectionState } from "./selection";

export interface EditorContextRequest {
  target: EditorSelection;
  x: number;
  y: number;
  canvasPosition?: EditorPoint;
}

export interface EditorContextItem {
  action: EditorAction;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export function editorContextItems(
  design: Design,
  target: EditorSelection,
  canPaste: boolean,
  selectedIds: string[] = [],
): EditorContextItem[] {
  const full = design.elements.length >= MAX_ELEMENTS;
  if (target === "background") {
    return [
      {
        action: "paste",
        label: "Paste",
        shortcut: "⌘V",
        disabled: !canPaste || full,
      },
    ];
  }
  const selection = layerSelectionState(design, target, selectedIds);
  if (!selection) return [];
  const { elements, multiple, locked, allVisible, atFront, atBack } = selection;
  const duplicateFull = design.elements.length + elements.length > MAX_ELEMENTS;
  const groupLabel = `${elements.length} layers`;
  const visibilityLabel = allVisible ? "Hide" : "Show";
  const lockLabel = locked ? "Unlock" : "Lock";
  const visibilityMenuLabel = multiple
    ? `${visibilityLabel} ${groupLabel}`
    : visibilityLabel;
  return [
    {
      action: "copy",
      label: multiple ? `Copy ${groupLabel}` : "Copy",
      shortcut: "⌘C",
    },
    {
      action: "cut",
      label: multiple ? `Cut ${groupLabel}` : "Cut",
      shortcut: "⌘X",
      disabled: locked,
    },
    {
      action: "paste",
      label: "Paste",
      shortcut: "⌘V",
      disabled: !canPaste || full,
    },
    {
      action: "duplicate",
      label: multiple ? `Duplicate ${groupLabel}` : "Duplicate",
      shortcut: "⌘D",
      disabled: locked || duplicateFull,
      divider: true,
    },
    {
      action: "bring-forward",
      label: multiple ? "Bring group forward" : "Bring forward",
      shortcut: "⌘]",
      disabled: locked || atFront,
      divider: true,
    },
    {
      action: "send-backward",
      label: multiple ? "Send group backward" : "Send backward",
      shortcut: "⌘[",
      disabled: locked || atBack,
    },
    {
      action: "bring-front",
      label: multiple ? "Bring group to front" : "Bring to front",
      shortcut: "⇧⌘]",
      disabled: locked || atFront,
    },
    {
      action: "send-back",
      label: multiple ? "Send group to back" : "Send to back",
      shortcut: "⇧⌘[",
      disabled: locked || atBack,
    },
    {
      action: "toggle-visibility",
      label: visibilityMenuLabel,
      disabled: locked,
      divider: true,
    },
    {
      action: "toggle-lock",
      label: multiple ? `${lockLabel} ${groupLabel}` : lockLabel,
    },
    {
      action: "delete",
      label: multiple ? `Delete ${groupLabel}` : "Delete",
      shortcut: "⌫",
      disabled: locked,
      danger: true,
      divider: true,
    },
  ];
}

import { MAX_ELEMENTS, type Design } from "../../../watchface/schema";
import type { EditorPoint, EditorSelection } from "../types";
import type { EditorAction } from "./shortcuts";

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
  const element = design.elements.find((item) => item.id === target);
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
  if (!element) return [];

  const index = design.elements.indexOf(element);
  const targets = selectedIds.includes(element.id) ? selectedIds : [element.id];
  const locked = design.elements.some(
    (item) => targets.includes(item.id) && item.locked,
  );
  const duplicateFull = design.elements.length + targets.length > MAX_ELEMENTS;
  const atFront = index === design.elements.length - 1;
  const atBack = index === 0;
  return [
    { action: "copy", label: "Copy", shortcut: "⌘C" },
    { action: "cut", label: "Cut", shortcut: "⌘X", disabled: locked },
    {
      action: "paste",
      label: "Paste",
      shortcut: "⌘V",
      disabled: !canPaste || full,
    },
    {
      action: "duplicate",
      label: "Duplicate",
      shortcut: "⌘D",
      disabled: locked || duplicateFull,
      divider: true,
    },
    {
      action: "bring-forward",
      label: "Bring forward",
      shortcut: "⌘]",
      disabled: locked || atFront,
      divider: true,
    },
    {
      action: "send-backward",
      label: "Send backward",
      shortcut: "⌘[",
      disabled: locked || atBack,
    },
    {
      action: "bring-front",
      label: "Bring to front",
      shortcut: "⇧⌘]",
      disabled: locked || atFront,
    },
    {
      action: "send-back",
      label: "Send to back",
      shortcut: "⇧⌘[",
      disabled: locked || atBack,
    },
    {
      action: "toggle-visibility",
      label: element.visible ? "Hide" : "Show",
      disabled: locked,
      divider: true,
    },
    {
      action: "toggle-lock",
      label: element.locked ? "Unlock" : "Lock",
    },
    {
      action: "delete",
      label: "Delete",
      shortcut: "⌫",
      disabled: locked,
      danger: true,
      divider: true,
    },
  ];
}

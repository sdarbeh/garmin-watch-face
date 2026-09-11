export type EditorShortcut =
  | "copy"
  | "cut"
  | "paste"
  | "duplicate"
  | "delete"
  | "bring-forward"
  | "send-backward"
  | "bring-front"
  | "send-back";

export type EditorAction = EditorShortcut | "toggle-visibility" | "toggle-lock";

interface KeyboardGesture {
  key: string;
  code?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Maps platform-neutral key gestures to editor actions without touching state. */
export function editorShortcut(event: KeyboardGesture): EditorShortcut | null {
  if (event.altKey) return null;
  const modifier = event.metaKey || event.ctrlKey;
  if (!modifier) {
    return event.key === "Delete" || event.key === "Backspace"
      ? "delete"
      : null;
  }

  const key = event.key.toLowerCase();
  if (key === "c") return "copy";
  if (key === "x") return "cut";
  if (key === "v") return "paste";
  if (key === "d") return "duplicate";
  if (event.code === "BracketRight")
    return event.shiftKey ? "bring-front" : "bring-forward";
  if (event.code === "BracketLeft")
    return event.shiftKey ? "send-back" : "send-backward";
  return null;
}

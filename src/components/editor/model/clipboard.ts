import type { FaceElement } from "../../../watchface/schema";
import type { EditorPoint } from "../types";

const CANVAS_MIN = 50;
const CANVAS_MAX = 404;
const PASTE_OFFSET = 12;

/** Returns the visible default position for the next clipboard placement. */
export function nextPastePosition(
  anchor: EditorPoint,
  pasteCount = 0,
): EditorPoint {
  const offset = (pasteCount + 1) * PASTE_OFFSET;
  return { x: anchor.x + offset, y: anchor.y + offset };
}

/** Translates a clipboard group without changing spacing at canvas edges. */
export function placeClipboardElements(
  elements: FaceElement[],
  anchor: EditorPoint,
  position: EditorPoint,
) {
  if (!elements.length) return [];
  const xs = elements.map((element) => element.x);
  const ys = elements.map((element) => element.y);
  const requestedX = position.x - anchor.x;
  const requestedY = position.y - anchor.y;
  const dx = Math.max(
    CANVAS_MIN - Math.min(...xs),
    Math.min(CANVAS_MAX - Math.max(...xs), requestedX),
  );
  const dy = Math.max(
    CANVAS_MIN - Math.min(...ys),
    Math.min(CANVAS_MAX - Math.max(...ys), requestedY),
  );
  return elements.map((element) => ({
    ...element,
    x: Math.round(element.x + dx),
    y: Math.round(element.y + dy),
  }));
}

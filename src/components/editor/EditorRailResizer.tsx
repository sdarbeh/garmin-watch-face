import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export const EDITOR_RAILS = {
  left: { default: 260, min: 208, max: 320 },
  right: { default: 272, min: 240, max: 480 },
} as const;

export type EditorRailSide = keyof typeof EDITOR_RAILS;

interface ActiveRailDrag {
  pointer: number;
  x: number;
  width: number;
  cleanup: () => void;
}

function clampRail(side: EditorRailSide, value: number) {
  const limits = EDITOR_RAILS[side];
  return Math.max(limits.min, Math.min(limits.max, Math.round(value)));
}

export function EditorRailResizer({
  side,
  value,
  onChange,
}: {
  side: EditorRailSide;
  value: number;
  onChange: (value: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const drag = useRef<ActiveRailDrag | null>(null);
  const resizer = useRef<HTMLDivElement>(null);
  const limits = EDITOR_RAILS[side];

  useEffect(() => {
    return () => drag.current?.cleanup();
  }, []);

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const handledKeys = ["Home", "End", "ArrowLeft", "ArrowRight"];
    if (!handledKeys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Home") {
      onChange(limits.min);
      return;
    }
    if (event.key === "End") {
      onChange(limits.max);
      return;
    }
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const sideDirection = side === "left" ? direction : -direction;
    onChange(clampRail(side, value + sideDirection * 8));
  }

  function resizeWithPointer(event: globalThis.PointerEvent) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    positionHandle(event.clientY);
    const delta = event.clientX - active.x;
    onChange(
      clampRail(side, active.width + (side === "left" ? delta : -delta)),
    );
  }

  function positionHandle(clientY: number) {
    const element = resizer.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const y = Math.max(0, Math.min(bounds.height, clientY - bounds.top));
    element.style.setProperty("--rail-resizer-y", `${y}px`);
  }

  function stopDragging(pointerId?: number) {
    const active = drag.current;
    if (!active || (pointerId !== undefined && active.pointer !== pointerId))
      return;
    active.cleanup();
    drag.current = null;
    setDragging(false);
  }

  return (
    <div
      ref={resizer}
      className="watchface-rail-resizer"
      data-side={side}
      data-dragging={dragging}
      role="separator"
      tabIndex={0}
      aria-label={`Resize ${side} rail`}
      aria-orientation="vertical"
      aria-valuemin={limits.min}
      aria-valuemax={limits.max}
      aria-valuenow={value}
      title={`Drag to resize ${side} rail. Double-click to reset.`}
      onDoubleClick={() => onChange(limits.default)}
      onKeyDown={resizeWithKeyboard}
      onPointerMove={(event) => positionHandle(event.clientY)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        positionHandle(event.clientY);
        event.currentTarget.focus();
        stopDragging();
        const finish = (pointerEvent: globalThis.PointerEvent) =>
          stopDragging(pointerEvent.pointerId);
        const cleanup = () => {
          window.removeEventListener("pointermove", resizeWithPointer);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", finish);
        };
        drag.current = {
          pointer: event.pointerId,
          x: event.clientX,
          width: value,
          cleanup,
        };
        window.addEventListener("pointermove", resizeWithPointer);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", finish);
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onLostPointerCapture={() => {
        stopDragging();
      }}
    />
  );
}

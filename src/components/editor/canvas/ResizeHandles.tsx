import { RESIZE_CORNERS, cornerPoint } from "../model/resize";
import { elementBounds } from "../model/geometry";
import type { renderModel } from "@/watchface/render-model";
import type { SelectionRect } from "../model/selection";

function Handle({
  x,
  y,
  corner,
  size,
}: {
  x: number;
  y: number;
  corner: (typeof RESIZE_CORNERS)[number];
  size: number;
}) {
  return (
    <g
      data-resize={corner}
      className={`watchface-resize__handle watchface-resize__handle--${corner}`}
    >
      <title>Drag to resize</title>
      <rect
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
        fill="transparent"
      />
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        fill="var(--app-color-primary)"
        stroke="var(--app-color-text)"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

export function ResizeHandles({
  element,
  scale,
}: {
  element: ReturnType<typeof renderModel>[number];
  scale: number;
}) {
  const bounds = elementBounds(element);
  const size = 8 / scale;
  return (
    <g data-element={element.id} className="watchface-resize">
      <rect
        x={bounds.left}
        y={element.y - bounds.height / 2}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="var(--app-color-primary)"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      {!element.locked &&
        RESIZE_CORNERS.map((corner) => {
          const point = cornerPoint(element, corner);
          return (
            <Handle
              key={corner}
              x={point.x}
              y={point.y}
              corner={corner}
              size={size}
            />
          );
        })}
    </g>
  );
}

export function GroupResizeHandles({
  bounds,
  scale,
  disabled,
}: {
  bounds: SelectionRect;
  scale: number;
  disabled: boolean;
}) {
  const size = 8 / scale;
  return (
    <g className="watchface-resize watchface-resize--group">
      <rect
        {...bounds}
        className="watchface-selection-group"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      {!disabled &&
        RESIZE_CORNERS.map((corner) => {
          const x = corner.includes("e") ? bounds.x + bounds.width : bounds.x;
          const y = corner.includes("s") ? bounds.y + bounds.height : bounds.y;
          return (
            <Handle key={corner} x={x} y={y} corner={corner} size={size} />
          );
        })}
    </g>
  );
}

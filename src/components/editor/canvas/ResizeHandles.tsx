import { RESIZE_CORNERS, cornerPoint } from "../model/resize";
import { elementBounds } from "../model/geometry";
import type { renderModel } from "@/watchface/render-model";
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
            <g
              key={corner}
              data-resize={corner}
              className={`watchface-resize__handle watchface-resize__handle--${corner}`}
            >
              <title>Drag to resize</title>
              <rect
                x={point.x - size}
                y={point.y - size}
                width={size * 2}
                height={size * 2}
                fill="transparent"
              />
              <rect
                x={point.x - size / 2}
                y={point.y - size / 2}
                width={size}
                height={size}
                fill="var(--app-color-primary)"
                stroke="var(--app-color-text)"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
    </g>
  );
}

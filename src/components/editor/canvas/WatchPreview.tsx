import { GroupResizeHandles, ResizeHandles } from "./ResizeHandles";
import { getDeviceById } from "@/devices/catalog";
import { DeviceFrame } from "./DeviceFrame";
import { VisualLayer } from "./VisualLayer";
import { useId, type PointerEventHandler, type RefObject } from "react";
import type { Design, ElementId } from "@/watchface/schema";
import { elementBounds } from "../model/geometry";
import { selectionBounds, type SelectionRect } from "../model/selection";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
import { CanvasGrid } from "./CanvasGrid";
export function WatchPreview({
  design,
  scale = 1,
  clipArea,
  showClipArea = false,
  samples = SAMPLE_DATA,
  selected,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  guides = [],
  selectedIds = [],
  marquee,
  showGrid = false,
}: {
  design: Design;
  scale?: number;
  clipArea?: { x: number; y: number; width: number; height: number };
  showClipArea?: boolean;
  samples?: typeof SAMPLE_DATA;
  selected: ElementId | null;
  svgRef?: RefObject<SVGSVGElement | null>;
  onPointerDown?: PointerEventHandler<SVGSVGElement>;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: PointerEventHandler<SVGSVGElement>;
  onLostPointerCapture?: PointerEventHandler<SVGSVGElement>;
  guides?: { axis: "x" | "y"; value: number }[];
  selectedIds?: ElementId[];
  marquee?: SelectionRect | null;
  showGrid?: boolean;
}) {
  const device = getDeviceById(design.device)!;
  const frame = device.frame;
  const elements = renderModel(design, samples);
  const selection = elements.find((e) => e.id === selected);
  const additionalSelections = elements.filter(
    (element) => selectedIds.includes(element.id) && element.id !== selected,
  );
  const groupBounds =
    selectedIds.length > 1
      ? selectionBounds(design, selectedIds, samples)
      : null;
  const groupResizeDisabled = design.elements.some(
    (element) =>
      selectedIds.includes(element.id) && (!element.visible || element.locked),
  );
  const clip = useId();
  const contentClip = useId();
  return (
    <svg
      ref={svgRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
      viewBox={`${-frame.screenX} ${-frame.screenY} ${frame.width} ${frame.height}`}
      role="img"
      aria-label={`${device.name} design preview using sample data`}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="227" cy="227" r="227" />
        </clipPath>
        {clipArea && (
          <clipPath id={contentClip}>
            <rect {...clipArea} />
          </clipPath>
        )}
      </defs>
      <DeviceFrame device={device} />
      <g clipPath={`url(#${clip})`}>
        <rect width="454" height="454" fill={design.background} />
        <g clipPath={clipArea ? `url(#${contentClip})` : undefined}>
          {elements.map((e) => (
            <g key={e.id} data-element={e.id} data-locked={e.locked}>
              <rect
                x={elementBounds(e).left}
                y={e.y - elementBounds(e).height / 2}
                width={elementBounds(e).width}
                height={elementBounds(e).height}
                fill="transparent"
              />
              <VisualLayer element={e} />
            </g>
          ))}
        </g>
        {showGrid && <CanvasGrid />}
        {clipArea && showClipArea && (
          <rect
            {...clipArea}
            fill="none"
            stroke="var(--app-color-primary)"
            strokeWidth="1"
            strokeDasharray="5 5"
            pointerEvents="none"
          />
        )}
        {guides.map((guide) => (
          <line
            key={guide.axis}
            x1={guide.axis === "x" ? guide.value : 0}
            x2={guide.axis === "x" ? guide.value : 454}
            y1={guide.axis === "y" ? guide.value : 0}
            y2={guide.axis === "y" ? guide.value : 454}
            stroke="var(--app-color-primary)"
            strokeWidth="1"
            strokeDasharray="5 5"
            pointerEvents="none"
          />
        ))}
        {marquee && (
          <rect
            {...marquee}
            className="watchface-selection-marquee"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
      </g>
      {groupBounds && (
        <GroupResizeHandles
          bounds={groupBounds}
          scale={scale}
          disabled={groupResizeDisabled}
        />
      )}
      {additionalSelections.map((element) => {
        const bounds = elementBounds(element);
        return (
          <rect
            key={element.id}
            x={bounds.left}
            y={element.y - bounds.height / 2}
            width={bounds.width}
            height={bounds.height}
            fill="none"
            stroke="var(--app-color-primary)"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        );
      })}
      {selection && !groupBounds && (
        <ResizeHandles element={selection} scale={scale} />
      )}
    </svg>
  );
}

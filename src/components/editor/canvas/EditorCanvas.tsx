import {
  RESIZE_CORNERS,
  resizeLayer,
  type ResizeCorner,
} from "../model/resize";
import { DeviceTags } from "@/components/devices/DeviceTags";
import { lowBatteryThreshold } from "@/watchface/power";
import { useLayoutEffect, useRef, useState } from "react";
import { ZoomControls } from "./ZoomControls";
import { WatchPreview } from "./WatchPreview";
import { getDeviceById } from "@/devices/catalog";
import { type Design, type ElementId } from "@/watchface/schema";
import type { EditorPoint, EditorSelection } from "../types";
import type { EditorContextRequest } from "../model/context-menu";
import type { EditorCommandResult } from "../model/commands";
import { moveElement, moveElementsBy, snapPosition } from "../model/geometry";
import {
  layersInSelection,
  mergeMarqueeSelection,
  selectionRect,
  type MarqueeSelectionMode,
  type SelectionRect,
} from "../model/selection";
import type { useDesignHistory } from "../hooks/useDesignHistory";

import {
  simulationValues,
  type Simulation,
  type DisplayMode,
} from "../model/simulation";

type Guide = { axis: "x" | "y"; value: number };
export function EditorCanvas({
  design,
  selected,
  selectedIds,
  preview,
  ready,
  onSelect,
  onSelectMany,
  onOpenContextMenu,
  history,
  keyboardGuides,
  simulation,
  displayMode,
  zoom,
  onZoomChange,
  onCanvasPoint,
  onDuplicateForDrag,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onCanvasPoint: (point: EditorPoint) => void;
  onDuplicateForDrag: (ids: ElementId[]) => EditorCommandResult | null;
  keyboardGuides: Guide[];
  simulation: Simulation;
  displayMode: DisplayMode;
  design: Design;
  selected: EditorSelection;
  selectedIds: string[];
  preview: boolean;
  ready: boolean;
  onSelect: (selection: EditorSelection, additive?: boolean) => void;
  onSelectMany: (selections: ElementId[]) => void;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  history: Pick<
    ReturnType<typeof useDesignHistory>,
    "begin" | "commit" | "cancel" | "update"
  >;
}) {
  const device = getDeviceById(design.device)!;
  const viewport = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: ElementId;
    ids: ElementId[];
    start: Design;
    x: number;
    y: number;
    pointer: number;
    corner?: ResizeCorner;
  } | null>(null);
  const marquee = useRef<{
    pointer: number;
    start: EditorPoint;
    selected: ElementId[];
    applied: ElementId[];
    mode: MarqueeSelectionMode;
  } | null>(null);
  const pan = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const space = useRef(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<SelectionRect | null>(null);
  const pixels = (device.frame.presentationWidth * zoom) / 100;
  const scale = pixels / device.frame.width;
  const samples = simulationValues(simulation, displayMode);
  useLayoutEffect(() => {
    const stage = viewport.current;
    if (!stage) return;
    stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
    stage.scrollTop = Math.max(
      0,
      (stage.scrollHeight - stage.clientHeight) / 2,
    );
  }, [zoom, preview]);
  function point(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  }
  function displayPoint(clientX: number, clientY: number) {
    const current = point(clientX, clientY);
    if (!current) return null;
    return {
      x: Math.max(0, Math.min(454, current.x)),
      y: Math.max(0, Math.min(454, current.y)),
    };
  }
  function finishMarquee(cancel = false) {
    const active = marquee.current;
    if (!active) return;
    if (cancel) onSelectMany(active.selected);
    marquee.current = null;
    setMarqueeRect(null);
  }
  function finish(cancel = false) {
    if (!drag.current) return;
    drag.current = null;
    setGuides([]);
    if (cancel) history.cancel();
    else history.commit();
  }
  return (
    <section className="watchface-preview" aria-label="Watch canvas">
      <div className="u-flex u-flex-wrap u-items-center gap3">
        <h2 className="u-font-md u-weight-bold">{device.name}</h2>
        <DeviceTags device={device} />
      </div>
      {displayMode !== "normal" && (
        <p className="u-font-xs u-text-secondary" role="status">
          {
            {
              "always-on":
                "Always-on · Keep the layout dim to reduce display power",
              night:
                "Night · Edit this layout; enable its trigger in Background settings",
              "low-battery": `Low battery · Simplified layout at ${lowBatteryThreshold(design)}% or below`,
            }[displayMode]
          }
        </p>
      )}
      <div
        className="watchface-preview__stage"
        ref={viewport}
        tabIndex={0}
        aria-label="Canvas. Drag empty space to select layers. Drag elements to move; drag corner handles to resize. Arrow keys nudge. Hold Space and drag to pan."
        onKeyDown={(event) => {
          if (event.code === "Space") {
            event.preventDefault();
            space.current = true;
          }
          if (event.key === "Escape") {
            finish(true);
            finishMarquee(true);
          }
        }}
        onKeyUp={(event) => {
          if (event.code === "Space") space.current = false;
        }}
        onBlur={() => {
          space.current = false;
          pan.current = null;
          finish();
          finishMarquee(true);
        }}
        onContextMenu={(event) => {
          if (!ready || preview) return;
          event.preventDefault();
          finish();
          finishMarquee(true);
          const elementId = (event.target as Element)
            .closest("[data-element]")
            ?.getAttribute("data-element") as ElementId | undefined;
          let target: EditorSelection = "background";
          if (
            elementId &&
            design.elements.some((element) => element.id === elementId)
          )
            target = elementId;
          const canvasPosition = point(event.clientX, event.clientY);
          if (target === "background" || !selectedIds.includes(target))
            onSelect(target);
          const request: EditorContextRequest = {
            target,
            x: event.clientX,
            y: event.clientY,
          };
          if (canvasPosition)
            request.canvasPosition = {
              x: canvasPosition.x,
              y: canvasPosition.y,
            };
          onOpenContextMenu(request);
        }}
        onPointerDownCapture={(event) => {
          const canvasPoint = point(event.clientX, event.clientY);
          if (canvasPoint) onCanvasPoint(canvasPoint);
          if (!(space.current || event.button === 1)) return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.focus();
          pan.current = {
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerDown={(event) => {
          if (
            !preview &&
            ready &&
            event.button === 0 &&
            !(event.target as Element).closest("svg")
          ) {
            event.currentTarget.focus();
            onSelect("background");
          }
        }}
        onPointerMove={(event) => {
          if (!pan.current) return;
          event.currentTarget.scrollLeft =
            pan.current.left + pan.current.x - event.clientX;
          event.currentTarget.scrollTop =
            pan.current.top + pan.current.y - event.clientY;
        }}
        onPointerUp={(event) => {
          pan.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={() => {
          pan.current = null;
          finish();
        }}
        onPointerCancel={() => {
          pan.current = null;
          finish(true);
        }}
      >
        <div className="watchface-preview__surface">
          <div
            className="watchface-preview__watch"
            style={{
              width: pixels,
              height: (pixels * device.frame.height) / device.frame.width,
            }}
          >
            <WatchPreview
              design={design}
              scale={scale}
              samples={samples}
              selected={preview || selected === "background" ? null : selected}
              svgRef={svg}
              guides={preview ? [] : [...guides, ...keyboardGuides]}
              selectedIds={selectedIds}
              marquee={marqueeRect}
              onPointerDown={(event) => {
                if (event.button !== 0 || !ready || preview || drag.current)
                  return;
                event.preventDefault();
                viewport.current?.focus();
                const id = (event.target as Element)
                  .closest("[data-element]")
                  ?.getAttribute("data-element") as ElementId | undefined;
                const start = point(event.clientX, event.clientY);
                if (!start) return;
                const additive = Boolean(
                  event.shiftKey || event.metaKey || event.ctrlKey,
                );
                if (!id) {
                  const insideDisplay =
                    (start.x - 227) ** 2 + (start.y - 227) ** 2 <= 227 ** 2;
                  if (!insideDisplay) {
                    if (!additive) onSelect("background");
                    return;
                  }
                  let mode: MarqueeSelectionMode = "replace";
                  if (event.shiftKey) mode = "add";
                  if (event.metaKey || event.ctrlKey) mode = "toggle";
                  const origin = displayPoint(event.clientX, event.clientY)!;
                  marquee.current = {
                    pointer: event.pointerId,
                    start: origin,
                    selected: selectedIds,
                    applied: mergeMarqueeSelection(selectedIds, [], mode),
                    mode,
                  };
                  setMarqueeRect(selectionRect(origin, origin));
                  onSelectMany(marquee.current.applied);
                  event.currentTarget.setPointerCapture(event.pointerId);
                  return;
                }
                if (!selectedIds.includes(id) || additive)
                  onSelect(id, additive);
                if (
                  design.elements.find((element) => element.id === id)?.locked
                )
                  return;
                const handle = (event.target as Element)
                  .closest("[data-resize]")
                  ?.getAttribute("data-resize");
                const corner = RESIZE_CORNERS.find(
                  (corner) => corner === handle,
                );
                let dragId = id;
                let dragDesign = design;
                let dragIds = selectedIds.includes(id) ? selectedIds : [id];
                if (
                  dragIds.some(
                    (selectedId) =>
                      design.elements.find(
                        (element) => element.id === selectedId,
                      )?.locked,
                  )
                )
                  return;
                history.begin();
                if (event.altKey) {
                  const duplicate = onDuplicateForDrag(dragIds);
                  let duplicatedIds = duplicate?.selections ?? [];
                  if (!duplicatedIds.length && duplicate?.selection)
                    duplicatedIds = [duplicate.selection];
                  if (!duplicate || !duplicatedIds.length) {
                    history.cancel();
                    return;
                  }
                  dragId = duplicatedIds.at(-1)!;
                  dragDesign = duplicate.design;
                  dragIds = duplicatedIds;
                }
                drag.current = {
                  id: dragId,
                  ids: dragIds,
                  start: dragDesign,
                  x: start.x,
                  y: start.y,
                  pointer: event.pointerId,
                  corner,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const activeMarquee = marquee.current;
                if (
                  activeMarquee &&
                  event.pointerId === activeMarquee.pointer
                ) {
                  const current = displayPoint(event.clientX, event.clientY);
                  if (!current) return;
                  const rect = selectionRect(activeMarquee.start, current);
                  setMarqueeRect(rect);
                  const nextSelection = mergeMarqueeSelection(
                    activeMarquee.selected,
                    layersInSelection(design, rect, samples),
                    activeMarquee.mode,
                  );
                  if (
                    nextSelection.length !== activeMarquee.applied.length ||
                    nextSelection.some(
                      (id, index) => id !== activeMarquee.applied[index],
                    )
                  ) {
                    activeMarquee.applied = nextSelection;
                    onSelectMany(nextSelection);
                  }
                  return;
                }
                const active = drag.current;
                const current = point(event.clientX, event.clientY);
                if (!active || !current || event.pointerId !== active.pointer)
                  return;
                const element = active.start.elements.find(
                  (element) => element.id === active.id,
                );
                if (!element) {
                  finish(true);
                  return;
                }
                if (active.corner) {
                  const resized = resizeLayer(
                    active.start,
                    active.id,
                    active.corner,
                    current.x - active.x,
                    current.y - active.y,
                    event.altKey ? 0 : 6 / scale,
                    samples,
                  );
                  setGuides(resized.guides);
                  history.update(resized.design);
                  return;
                }
                const x = element.x + current.x - active.x;
                const y = element.y + current.y - active.y;
                const snapped = event.altKey
                  ? { x, y, guides: [] }
                  : snapPosition(
                      active.start,
                      active.id,
                      x,
                      y,
                      6 / scale,
                      samples,
                      active.ids,
                    );
                setGuides(snapped.guides);
                if (active.ids.length === 1) {
                  history.update(
                    moveElement(active.start, active.id, snapped.x, snapped.y),
                  );
                  return;
                }
                history.update(
                  moveElementsBy(
                    active.start,
                    active.ids,
                    snapped.x - element.x,
                    snapped.y - element.y,
                  ),
                );
              }}
              onPointerUp={(event) => {
                finishMarquee();
                finish();
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                finishMarquee(true);
                finish(true);
              }}
              onLostPointerCapture={() => {
                finishMarquee();
                finish();
              }}
            />
          </div>
        </div>
      </div>
      <ZoomControls value={zoom} onChange={onZoomChange} />
    </section>
  );
}

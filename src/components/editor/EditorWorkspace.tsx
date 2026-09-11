"use client";
import { presentation } from "@/watchface/schema";

import {
  powerLayout,
  updateModeLayout,
  resolvePowerMode,
} from "@/watchface/power";
import { getDeviceById } from "@/devices/catalog";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { browserLibrary, type SavedDesign } from "@/library/store";
import { useWatchfaceBuild } from "./hooks/useWatchfaceBuild";
import { EditorFooter } from "./EditorFooter";
import {
  DEFAULT_SIMULATION,
  createDefaultSimulation,
  simulationValues,
  type DisplayMode,
} from "./model/simulation";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./canvas/EditorCanvas";
import { EditorInspector } from "./inspector/EditorInspector";
import { EditorLayers } from "./EditorLayers";
import { EditorExport } from "./export/EditorExport";
import { useDesignHistory } from "./hooks/useDesignHistory";
import { snapPosition } from "./model/geometry";
import {
  executeEditorCommand,
  type EditorCommand,
  type EditorCommandResult,
} from "./model/commands";
import type { EditorSelection } from "./types";

export function EditorWorkspace({
  project,
  saved,
  error,
}: {
  project: SavedDesign;
  saved: string;
  error: string;
}) {
  const { design } = project;
  const ready = true;
  const history = useDesignHistory(project.id);
  const setDesign = history.update;
  const [selection, setSelected] = useState<EditorSelection>("time");

  const [keyboardGuides, setKeyboardGuides] = useState<
    { axis: "x" | "y"; value: number }[]
  >([]);
  useEffect(() => {
    if (!keyboardGuides.length) return;
    const timeout = setTimeout(() => setKeyboardGuides([]), 700);
    return () => clearTimeout(timeout);
  }, [keyboardGuides]);
  const [simulation, setSimulation] = useState(DEFAULT_SIMULATION);
  useEffect(() => {
    // Initialize after hydration; server time/timezone must not seed the editor.
    const frame = requestAnimationFrame(() =>
      setSimulation(createDefaultSimulation()),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("normal");
  const activeDesign = powerLayout(design, displayMode);
  const selected = activeDesign.elements.some(
    (element) => element.id === selection,
  )
    ? selection
    : "background";
  const setActiveDesign = (edited: typeof design) => {
    const next = updateModeLayout(
      browserLibrary.find(project.id)!.design,
      displayMode,
      edited,
    );
    setDesign(next);
    return powerLayout(next, displayMode);
  };
  const activeHistory = { ...history, update: setActiveDesign };
  const dispatchCommand = (
    command: EditorCommand,
  ): EditorCommandResult | null => {
    const current = browserLibrary.find(project.id)?.design;
    if (!current) return null;
    const result = executeEditorCommand(current, displayMode, command);
    setDesign(result.design);
    if (result.selection) setSelected(result.selection);
    return result;
  };

  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const canvasMode = preview
    ? resolvePowerMode(
        design,
        displayMode,
        simulation.battery,
        Number(simulation.time.slice(0, 2)) * 60 +
          Number(simulation.time.slice(3, 5)),
        simulation.dnd,
      )
    : displayMode;
  const [exportOpen, setExportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const build = useWatchfaceBuild(design, setMessage);

  return (
    <section
      className="watchface-studio"
      aria-label="Watch face editor"
      onPointerDownCapture={() => setKeyboardGuides([])}
      onFocusCapture={(event) => {
        if (
          (event.target as Element).matches("input, select, textarea") &&
          !(event.target as Element).closest("footer")
        )
          history.begin();
      }}
      onBlurCapture={(event) => {
        if (
          (event.target as Element).matches("input, select, textarea") &&
          !(event.target as Element).closest("footer")
        )
          history.commit();
      }}
      onKeyDown={(event) => {
        if (
          !ready ||
          exportOpen ||
          (event.target as Element).closest(
            "input, select, textarea, [contenteditable=true], dialog, footer",
          )
        )
          return;
        const key = event.key.toLowerCase();
        if ((event.metaKey || event.ctrlKey) && (key === "z" || key === "y")) {
          event.preventDefault();
          if (key === "y" || event.shiftKey) history.redo();
          else history.undo();
          return;
        }
        if (
          preview ||
          selected === "background" ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return;
        const delta = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }[event.key];
        if (!delta) return;
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        const current = powerLayout(
          browserLibrary.find(project.id)!.design,
          displayMode,
        );
        const element = current.elements.find((item) => item.id === selected);
        if (!element || element.locked || !element.visible) return;
        if (!event.repeat) history.begin();
        const result = dispatchCommand({
          type: "layer.move",
          id: selected,
          x: element.x + delta[0] * amount,
          y: element.y + delta[1] * amount,
        });
        if (!result) return;
        const applied = powerLayout(result.design, displayMode);
        const moved = applied.elements.find((item) => item.id === selected)!;
        // Exact alignment keeps one-pixel nudges from sticking to nearby targets.
        setKeyboardGuides(
          snapPosition(
            applied,
            selected,
            moved.x,
            moved.y,
            0,
            simulationValues(simulation, displayMode),
          ).guides,
        );
      }}
      onKeyUp={(event) => {
        if (
          event.key.startsWith("Arrow") &&
          !(event.target as Element).closest("input, select, textarea")
        )
          history.commit();
      }}
    >
      <EditorToolbar
        {...{ design, ready, saved, setDesign, preview }}
        onPreview={() => setPreview(!preview)}
        onExport={() => setExportOpen(true)}
      />
      {(error || message) && (
        <div
          className="watchface-editor-notice u-flex u-items-center u-justify-between gap3 px5 py2"
          role={error ? "alert" : "status"}
        >
          <p className="u-font-sm">{error || message}</p>
          {!error && (
            <Button variant="ghost" size="sm" onClick={() => setMessage("")}>
              Dismiss
            </Button>
          )}
        </div>
      )}
      <div className="watchface-workspace" data-preview={preview}>
        {!preview && (
          <EditorLayers
            selected={selected}
            onSelect={setSelected}
            key={`layers-${displayMode}`}
            design={activeDesign}
            onCommand={dispatchCommand}
            ready={ready}
          />
        )}
        <EditorCanvas
          key={`canvas-${displayMode}`}
          design={powerLayout(design, canvasMode)}
          history={activeHistory}
          {...{ selected, preview, ready }}
          onSelect={setSelected}
          keyboardGuides={keyboardGuides}
          simulation={simulation}
          displayMode={canvasMode}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        {!preview && (
          <EditorInspector
            key={`inspector-${displayMode}`}
            design={activeDesign}
            simulation={simulation}
            onSimulationChange={setSimulation}
            setDesign={setActiveDesign}
            onCommand={dispatchCommand}
            onReset={() =>
              dispatchCommand({
                type: "project.reset",
                initialDesign: project.initialDesign,
              })
            }
            mode={displayMode}
            {...{ ready, selected }}
          />
        )}
      </div>
      <EditorFooter
        device={getDeviceById(design.device)!}
        ready={ready}
        history={history}
        simulation={simulation}
        onSimulationChange={setSimulation}
        selectedComplication={
          activeDesign.elements.find((e) => e.id === selected)?.complication
            ?.source
        }
        selectedVariant={(() => {
          const e = activeDesign.elements.find((e) => e.id === selected);
          return e ? presentation(e).variant : "";
        })()}
        selectedType={(() => {
          const e = activeDesign.elements.find(
            (element) => element.id === selected,
          );
          if (!e) return "background";
          return e.type === "progress" ? presentation(e).source : e.type;
        })()}
        mode={displayMode}
        onModeChange={(mode) => {
          if (mode === displayMode) return;
          history.commit();
          setKeyboardGuides([]);
          const currentElement = activeDesign.elements.find(
            (e) => e.id === selected,
          );
          const next = powerLayout(design, mode);
          setSelected(
            next.elements.find((e) => e.type === currentElement?.type)?.id ??
              next.elements.at(-1)?.id ??
              "background",
          );
          setDisplayMode(mode);
        }}
      />
      <EditorExport
        onDownloaded={() =>
          browserLibrary.recordDownload(design, { id: project.id })
        }
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        {...{ design, ready }}
        message={message}
        controller={build}
      />
    </section>
  );
}

"use client";
import { presentation } from "@/watchface/schema";

import {
  powerLayout,
  updateModeLayout,
  resolvePowerMode,
} from "@/watchface/power";
import { getDeviceById } from "@/devices/catalog";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { EditorLeftRail } from "./left-rail";
import { EditorExport } from "./export/EditorExport";
import { useDesignHistory } from "./hooks/useDesignHistory";
import { useEditorActions } from "./hooks/useEditorActions";
import { snapPosition } from "./model/geometry";
import {
  executeEditorCommand,
  type EditorCommand,
  type EditorCommandResult,
} from "./model/commands";
import type { EditorSelection } from "./types";
import { EditorContextMenu } from "./EditorContextMenu";
import type { EditorContextRequest } from "./model/context-menu";
import { baseDesignForProject } from "./model/reset";
import { useModeSelection } from "./hooks/useModeSelection";
import { designIssues, type DesignIssue } from "@/watchface/design-validation";
import { DesignValidationDialog } from "./DesignValidationDialog";
import {
  EDITOR_RAILS,
  EditorRailResizer,
  type EditorRailSide,
} from "./EditorRailResizer";

type EditorRailWidths = Record<EditorRailSide, number>;

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
  const [message, setMessage] = useState("");
  const history = useDesignHistory(project.id);
  const setDesign = history.update;
  const modeSelection = useModeSelection(design);
  const displayMode = modeSelection.mode;
  const selection = modeSelection.selected;
  const selectedIds = modeSelection.selectedIds;
  const [contextMenu, setContextMenu] = useState<EditorContextRequest | null>(
    null,
  );
  const applySelection = (next: EditorSelection, ids: string[]) => {
    setContextMenu(null);
    modeSelection.applySelection(next, ids);
  };
  const selectLayers = (ids: string[]) => {
    setContextMenu(null);
    modeSelection.selectLayers(ids);
  };
  const selectLayer = (next: EditorSelection, additive = false) => {
    setContextMenu(null);
    modeSelection.selectLayer(next, additive);
  };

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
  const activeDesign = powerLayout(design, displayMode);
  const contextMenuTargetExists =
    contextMenu?.target === "background" ||
    activeDesign.elements.some((element) => element.id === contextMenu?.target);
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
    try {
      const result = executeEditorCommand(current, displayMode, command);
      setDesign(result.design);
      if (result.selections) {
        applySelection(
          result.selections.at(-1) ?? "background",
          result.selections,
        );
      } else if (result.selection) selectLayer(result.selection);
      return result;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not edit this layer.",
      );
      return null;
    }
  };

  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [railWidths, setRailWidths] = useState<EditorRailWidths>({
    left: EDITOR_RAILS.left.default,
    right: EDITOR_RAILS.right.default,
  });
  const resizeRail = (side: EditorRailSide, width: number) => {
    setRailWidths((current) => ({ ...current, [side]: width }));
  };
  const canvasMode = preview
    ? resolvePowerMode(
        design,
        displayMode,
        simulation.battery,
        Number(simulation.time.slice(0, 2)) * 60 +
          Number(simulation.time.slice(3, 5)),
        false,
      )
    : displayMode;
  const [exportOpen, setExportOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationMode, setValidationMode] = useState(displayMode);
  const issues = useMemo(() => designIssues(design), [design]);
  const canBuild = ready && !issues.some((issue) => issue.severity === "error");
  const build = useWatchfaceBuild(design, setMessage);
  const editorActions = useEditorActions({
    projectId: project.id,
    mode: displayMode,
    selected,
    selectedIds,
    preview,
    onCommand: dispatchCommand,
    onMessage: setMessage,
  });
  const focusValidationTarget = (
    mode: DisplayMode,
    selection: EditorSelection,
  ) => {
    setContextMenu(null);
    history.commit();
    setKeyboardGuides([]);
    modeSelection.focusSelection(mode, selection);
  };
  const focusIssue = (issue: DesignIssue) => {
    focusValidationTarget(
      issue.mode ?? displayMode,
      issue.elementId ?? "background",
    );
  };

  return (
    <section
      className="watchface-studio"
      style={
        {
          "--app-editor-left-width-custom": `${railWidths.left}px`,
          "--app-editor-right-width-custom": `${railWidths.right}px`,
        } as CSSProperties
      }
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
        if (!ready || exportOpen || validationOpen) return;
        const target = event.target as Element;
        const textInput = target.closest(
          "input, select, textarea, [contenteditable=true]",
        );
        const overlay = target.closest("dialog, [role=menu]");
        const key = event.key.toLowerCase();
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key === "Enter" &&
          !textInput &&
          !overlay
        ) {
          event.preventDefault();
          setContextMenu(null);
          if (canBuild && build.status !== "building") setExportOpen(true);
          else if (issues.length > 0) {
            setValidationMode(displayMode);
            setValidationOpen(true);
          }
          return;
        }
        if (event.key === "Escape" && preview && !textInput && !overlay) {
          event.preventDefault();
          setPreview(false);
          return;
        }
        if (textInput || overlay || target.closest("footer")) return;
        if ((event.metaKey || event.ctrlKey) && (key === "z" || key === "y")) {
          event.preventDefault();
          if (key === "y" || event.shiftKey) history.redo();
          else history.undo();
          return;
        }
        if (editorActions.onKeyDown(event)) return;
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
        const desiredX = element.x + delta[0] * amount;
        const desiredY = element.y + delta[1] * amount;
        const snapped = snapPosition(
          current,
          selected,
          desiredX,
          desiredY,
          0,
          simulationValues(simulation, displayMode),
          selectedIds,
        );
        const result =
          selectedIds.length > 1
            ? dispatchCommand({
                type: "layer.move-many",
                ids: selectedIds,
                dx: snapped.x - element.x,
                dy: snapped.y - element.y,
              })
            : dispatchCommand({
                type: "layer.move",
                id: selected,
                x: desiredX,
                y: desiredY,
              });
        if (!result) return;
        const applied = powerLayout(result.design, displayMode);
        const moved = applied.elements.find((item) => item.id === selected)!;
        // Exact alignment shows guides without making one-pixel nudges sticky.
        setKeyboardGuides(
          snapPosition(
            applied,
            selected,
            moved.x,
            moved.y,
            0,
            simulationValues(simulation, displayMode),
            selectedIds,
          ).guides,
        );
      }}
      onKeyUp={(event) => {
        if (
          event.key.startsWith("Arrow") &&
          !(event.target as Element).closest(
            "input, select, textarea, [role=menu]",
          )
        )
          history.commit();
      }}
    >
      <EditorToolbar
        {...{
          design,
          ready,
          saved,
          setDesign,
          preview,
          validationOpen,
        }}
        canBuild={canBuild}
        buildState={build.status}
        issues={issues}
        onPreview={() => {
          setContextMenu(null);
          setPreview(!preview);
        }}
        onExport={() => {
          setContextMenu(null);
          setExportOpen(true);
        }}
        onValidation={() => {
          setContextMenu(null);
          setValidationMode(displayMode);
          setValidationOpen(true);
        }}
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
          <>
            <EditorLeftRail
              selected={selected}
              selectedIds={selectedIds}
              onSelect={selectLayer}
              onOpenContextMenu={setContextMenu}
              key={`layers-${displayMode}`}
              design={activeDesign}
              onCommand={dispatchCommand}
              ready={ready}
            />
            <EditorRailResizer
              side="left"
              value={railWidths.left}
              onChange={(width) => resizeRail("left", width)}
            />
          </>
        )}
        <EditorCanvas
          key={`canvas-${displayMode}`}
          design={powerLayout(design, canvasMode)}
          history={activeHistory}
          {...{ selected, preview, ready }}
          selectedIds={selectedIds}
          onSelect={selectLayer}
          onSelectMany={selectLayers}
          onOpenContextMenu={setContextMenu}
          keyboardGuides={keyboardGuides}
          simulation={simulation}
          displayMode={canvasMode}
          zoom={zoom}
          onZoomChange={setZoom}
          onCanvasPoint={editorActions.rememberCanvasPoint}
          onAddTemplate={(templateId, position) =>
            dispatchCommand({
              type: "layer.add-template",
              templateId,
              position,
            })
          }
          onDuplicateForDrag={(ids) =>
            ids.length > 1
              ? dispatchCommand({ type: "layer.duplicate-many", ids })
              : dispatchCommand({ type: "layer.duplicate", id: ids[0] })
          }
        />
        {!preview && (
          <>
            <EditorRailResizer
              side="right"
              value={railWidths.right}
              onChange={(width) => resizeRail("right", width)}
            />
            <EditorInspector
              key={`inspector-${displayMode}`}
              design={activeDesign}
              issues={issues}
              simulation={simulation}
              selectedIds={selectedIds}
              onSimulationChange={setSimulation}
              setDesign={setActiveDesign}
              onCommand={dispatchCommand}
              onIssueSelect={focusIssue}
              onReset={() =>
                dispatchCommand({
                  type: "project.reset",
                  initialDesign: project.initialDesign,
                })
              }
              onResetBase={() =>
                dispatchCommand({
                  type: "project.reset",
                  initialDesign: baseDesignForProject(project),
                })
              }
              mode={displayMode}
              {...{ ready, selected }}
            />
          </>
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
          setContextMenu(null);
          history.commit();
          setKeyboardGuides([]);
          modeSelection.changeMode(mode);
        }}
      />
      <EditorExport
        onDownloaded={() =>
          browserLibrary.recordDownload(design, { id: project.id })
        }
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        design={design}
        ready={canBuild}
        message={message}
        controller={build}
      />
      <DesignValidationDialog
        open={validationOpen}
        design={design}
        issues={issues}
        activeMode={validationMode}
        onClose={() => setValidationOpen(false)}
        onModeChange={setValidationMode}
        onNavigate={(mode, selection) => {
          setValidationOpen(false);
          focusValidationTarget(mode, selection);
        }}
      />
      {contextMenu && contextMenuTargetExists && !preview && !exportOpen && (
        <EditorContextMenu
          request={contextMenu}
          design={activeDesign}
          canPaste={editorActions.canPaste}
          selectedIds={selectedIds}
          onAction={editorActions.run}
          onClose={() => setContextMenu(null)}
        />
      )}
    </section>
  );
}

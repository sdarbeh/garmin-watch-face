import { isComplicationSource } from "@/watchface/complications";
import { OnWatchSettings } from "./OnWatchSettings";
import { ComplicationContent } from "./ComplicationContent";
import { InspectorSection } from "./InspectorSection";
import { AppearanceRules } from "./AppearanceRules";
import type { Simulation } from "../model/simulation";
import { MetricFormatting } from "./MetricFormatting";
import { getDeviceById } from "@/devices/catalog";
import { LayerPresentation } from "./LayerPresentation";
import { isGraphic } from "@/watchface/layer-catalog";
import { presentation } from "@/watchface/schema";
import type { PowerMode } from "@/watchface/power";
import { PowerSettings } from "./PowerSettings";
import { TypographyFields } from "./TypographyFields";
import { LayerActions } from "../LayerActions";
import { PositionField } from "./PositionField";
import { ResetProject } from "./ResetProject";
import { ColorField, Switch } from "@/components/ui";
import type { Design } from "@/watchface/schema";
import type { DesignIssue } from "@/watchface/design-validation";
import {
  LAYER_LABELS,
  defaultLayerLabel,
  layerLabel,
  type EditorSelection,
} from "../types";
import type {
  DispatchEditorCommand,
  EditorLayerPatch,
} from "../model/commands";
import { GroupInspector } from "./GroupInspector";
import { ModeLayoutSettings } from "./ModeLayoutSettings";
import { DesignChecks } from "./DesignChecks";
import { useMemo, type ReactNode } from "react";
import { InspectorHeader } from "./InspectorHeader";
import { TimeContent } from "./TimeContent";
import { LayerStateSettings } from "./LayerStateSettings";
import { DimensionField } from "./DimensionField";

export function EditorInspector({
  design,
  issues,
  simulation,
  onSimulationChange,
  mode = "normal",
  ready,
  selected,
  selectedIds = [],
  setDesign,
  onCommand,
  onIssueSelect,
  onReset,
  onResetBase,
}: {
  design: Design;
  issues: DesignIssue[];
  simulation: Simulation;
  onSimulationChange: (value: Simulation) => void;
  mode?: PowerMode;
  ready: boolean;
  selected: EditorSelection;
  selectedIds?: string[];
  setDesign: (design: Design) => void;
  onCommand: DispatchEditorCommand;
  onIssueSelect: (issue: DesignIssue) => void;
  onReset: () => void;
  onResetBase: () => void;
}) {
  const device = getDeviceById(design.device)!;
  const element =
    selected === "background"
      ? null
      : design.elements.find((item) => item.id === selected);
  const visibleIssues = useMemo(
    () =>
      issues.filter(
        (issue) =>
          !issue.mode || issue.mode === mode || issue.severity === "error",
      ),
    [issues, mode],
  );
  const groupIds = selectedIds.filter((id) =>
    design.elements.some((element) => element.id === id),
  );
  const modeSettings: ReactNode = (
    <ModeLayoutSettings
      design={design}
      mode={mode}
      disabled={!ready}
      onReset={() => onCommand({ type: "mode.reset" })}
    />
  );
  if (selected !== "background" && groupIds.length > 1) {
    return (
      <GroupInspector
        design={design}
        selected={selected}
        selectedIds={groupIds}
        ready={ready}
        onCommand={onCommand}
        modeSettings={modeSettings}
        issues={visibleIssues}
        onIssueSelect={onIssueSelect}
      />
    );
  }
  function updateElement(patch: EditorLayerPatch) {
    if (!element || element.locked || selected === "background") return;
    onCommand({ type: "layer.update", id: selected, patch });
  }
  return (
    <aside className="watchface-customizer" aria-label="Properties">
      <InspectorHeader
        title={element ? layerLabel(element) : LAYER_LABELS.background}
        badge={element ? `${LAYER_LABELS[element.type]} layer` : "Canvas"}
      />
      {element?.locked && (
        <p className="watchface-inspector-lock-notice">
          Unlock this layer to edit its properties.
        </p>
      )}
      {element && (
        <InspectorSection title="Layer">
          <label className="watchface-property-row ui-field">
            Name
            <input
              disabled={!ready || element.locked}
              maxLength={40}
              placeholder={defaultLayerLabel(element)}
              value={element.name ?? ""}
              onChange={(event) =>
                updateElement({
                  name: event.target.value.replace(/[^\x20-\x7E]/g, ""),
                })
              }
            />
          </label>
        </InspectorSection>
      )}
      {element?.type === "time" && (
        <TimeContent
          element={element}
          disabled={!ready || element.locked}
          onChange={updateElement}
        />
      )}
      {element?.type === "text" && (
        <InspectorSection title="Content" defaultOpen>
          <label className="watchface-property-row ui-field">
            Text
            <input
              disabled={!ready || element.locked}
              maxLength={40}
              value={element.text}
              onChange={(event) =>
                updateElement({
                  text: event.target.value.replace(/[^\x20-\x7E]/g, ""),
                })
              }
            />
          </label>
        </InspectorSection>
      )}
      {element ? (
        <>
          <ComplicationContent
            element={element}
            device={device}
            disabled={!ready || element.locked}
            onChange={updateElement}
          />
          <LayerPresentation
            key={selected}
            element={element}
            device={device}
            disabled={!ready || element.locked}
            onChange={updateElement}
          />
          {isComplicationSource(element.type) && (
            <InspectorSection title="Interaction">
              <Switch
                label="Hold to open"
                disabled={!ready || element.locked}
                checked={element.openOnHold ?? false}
                onCheckedChange={(openOnHold) => updateElement({ openOnHold })}
              />
            </InspectorSection>
          )}
          <AppearanceRules
            key={`rules-${element.id}`}
            element={element}
            device={device}
            mode={mode}
            disabled={!ready || element.locked}
            onChange={updateElement}
            simulation={simulation}
            onSimulationChange={onSimulationChange}
          />
          <MetricFormatting
            element={element}
            disabled={!ready || element.locked}
            onChange={updateElement}
          />
          {!isGraphic(element.type, presentation(element).variant) && (
            <InspectorSection title="Style">
              <TypographyFields
                key={selected}
                element={element}
                disabled={!ready || element.locked}
                onChange={updateElement}
              />
            </InspectorSection>
          )}
          <InspectorSection title="Position">
            <div className="watchface-position-fields">
              {(["x", "y"] as const).map((axis) => (
                <PositionField
                  key={`${selected}-${axis}`}
                  axis={axis}
                  value={element[axis]}
                  disabled={!ready || Boolean(element?.locked)}
                  min={0}
                  max={axis === "x" ? device.width : device.height}
                  onChange={(value) => updateElement({ [axis]: value })}
                />
              ))}
              {isGraphic(element.type, presentation(element).variant) &&
                (["width", "height"] as const).map((dimension) => (
                  <DimensionField
                    key={`${selected}-${dimension}`}
                    compact
                    label={dimension === "width" ? "W" : "H"}
                    value={presentation(element)[dimension]}
                    disabled={!ready || element.locked}
                    min={8}
                    max={dimension === "width" ? device.width : device.height}
                    onChange={(value) =>
                      updateElement({
                        presentation: {
                          ...presentation(element),
                          [dimension]: value,
                        },
                      })
                    }
                  />
                ))}
            </div>
            <p className="u-font-xs u-text-secondary">
              {isGraphic(element.type, presentation(element).variant)
                ? "X and Y position the center of this layer."
                : "X is the reference point; text sits left, centered, or right of it. Y is the vertical center."}
            </p>
          </InspectorSection>
          <LayerStateSettings
            visible={element.visible}
            locked={element.locked}
            ready={ready}
            onVisibilityChange={(visible) =>
              onCommand({
                type: "layer.set-visibility",
                ids: [element.id],
                visible,
              })
            }
            onLockChange={(locked) =>
              onCommand({
                type: "layer.set-lock",
                ids: [element.id],
                locked,
              })
            }
          />
        </>
      ) : (
        <>
          <InspectorSection title="Appearance" defaultOpen>
            <div className="watchface-property-row">
              <span>Face color</span>
              <ColorField
                label="Face color"
                value={design.background}
                disabled={!ready || mode === "always-on"}
                onChange={(background) => setDesign({ ...design, background })}
              />
            </div>
          </InspectorSection>
          <InspectorSection title="Canvas">
            <p className="u-font-sm u-text-secondary">
              {device.name}
              <br />
              {device.width} × {device.height} pixels · {device.display}
            </p>
          </InspectorSection>
          {device.capabilities.onWatchSettings && (
            <OnWatchSettings
              design={design}
              disabled={!ready}
              onChange={setDesign}
            />
          )}
          <PowerSettings
            design={design}
            disabled={!ready}
            onChange={setDesign}
          />
        </>
      )}
      <DesignChecks
        design={design}
        issues={visibleIssues}
        onIssueSelect={onIssueSelect}
      />
      <LayerActions
        design={design}
        selected={selected}
        selectedIds={selectedIds}
        ready={ready}
        onCommand={onCommand}
      />
      {modeSettings}
      {selected === "background" && mode === "normal" && (
        <InspectorSection title="Project settings">
          <ResetProject
            disabled={!ready}
            onConfirm={onReset}
            onResetBase={onResetBase}
          />
        </InspectorSection>
      )}
    </aside>
  );
}

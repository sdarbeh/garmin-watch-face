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
import { FontSizeField, TypographyAppearance } from "./TypographyFields";
import {
  FONT_FAMILIES,
  type FontFamily,
  type FontWeight,
} from "@/watchface/fonts";
import { LayerActions } from "../LayerActions";
import { PositionField } from "./PositionField";
import { ResetProject } from "./ResetProject";
import { Button, ColorField } from "@/components/ui";
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
      <h2 className="u-font-xl u-weight-semibold mb3">
        {element ? layerLabel(element) : LAYER_LABELS.background}
      </h2>
      {element?.locked && (
        <p className="u-font-sm u-text-secondary mb3">
          Unlock this layer to edit its properties.
        </p>
      )}
      {element && (
        <InspectorSection title="Layer" defaultOpen>
          <label className="watchface-property-row ui-field u-font-xs">
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
        <InspectorSection title="Content" defaultOpen>
          <div className="watchface-property-row u-font-xs">
            <span>Time format</span>
            <div
              className="watchface-segments"
              role="group"
              aria-label="Time format"
            >
              {(["12", "24"] as const).map((format) => (
                <Button
                  key={format}
                  size="sm"
                  variant="ghost"
                  disabled={!ready || element.locked}
                  active={element.timeFormat === format}
                  aria-pressed={element.timeFormat === format}
                  onClick={() => updateElement({ timeFormat: format })}
                >
                  {format} hour
                </Button>
              ))}
            </div>
          </div>
          <label className="watchface-property-row ui-field u-font-xs mt2">
            Display
            <select
              disabled={!ready || element.locked}
              value={presentation(element).variant}
              onChange={(event) =>
                updateElement({
                  presentation: {
                    ...presentation(element),
                    variant: event.target.value,
                  },
                })
              }
            >
              <option value="labeled">Hours &amp; minutes</option>
              <option value="seconds">Include seconds</option>
              <option value="hours">Hours only</option>
              <option value="minutes">Minutes only</option>
              <option value="analog">Analog hands</option>
              <option value="analog-seconds">Analog with seconds</option>
            </select>
          </label>
        </InspectorSection>
      )}
      {element?.type === "text" && (
        <InspectorSection title="Content" defaultOpen>
          <label className="ui-field u-grid gap2 u-font-xs">
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
              <label className="watchface-property-row u-font-xs">
                Hold to open
                <input
                  type="checkbox"
                  disabled={!ready || element.locked}
                  checked={element.openOnHold ?? false}
                  onChange={(e) =>
                    updateElement({ openOnHold: e.target.checked })
                  }
                />
              </label>
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
            <InspectorSection title="Typography" defaultOpen>
              <label className="watchface-property-row ui-field u-font-xs mb2">
                Font
                <select
                  disabled={!ready || element.locked}
                  value={element.family}
                  onChange={(event) => {
                    const family = event.target.value as FontFamily;
                    const weights: readonly number[] =
                      FONT_FAMILIES[family].weights;
                    updateElement({
                      family,
                      weight: weights.includes(element.weight)
                        ? element.weight
                        : 400,
                    });
                  }}
                >
                  {Object.entries(FONT_FAMILIES).map(([key, font]) => (
                    <option key={key} value={key}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="watchface-property-row ui-field u-font-xs mb2">
                Weight
                <select
                  disabled={
                    !ready ||
                    element.locked ||
                    FONT_FAMILIES[element.family].weights.length === 1
                  }
                  value={element.weight}
                  onChange={(event) =>
                    updateElement({
                      weight: Number(event.target.value) as FontWeight,
                    })
                  }
                >
                  {FONT_FAMILIES[element.family].weights.map((weight) => (
                    <option key={weight} value={weight}>
                      {weight === 400 ? "Regular" : "Bold"}
                    </option>
                  ))}
                </select>
              </label>
              <FontSizeField
                key={selected}
                value={element.size}
                disabled={!ready || element.locked}
                onChange={(size) => updateElement({ size })}
              />
              <TypographyAppearance
                key={selected + "-appearance"}
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
                  onChange={(value) => updateElement({ [axis]: value })}
                />
              ))}
            </div>
            <p className="u-font-xs u-text-secondary">
              {isGraphic(element.type, presentation(element).variant)
                ? "X and Y position the center of this layer."
                : "X is the reference point; text sits left, centered, or right of it. Y is the vertical center."}
            </p>
          </InspectorSection>
        </>
      ) : (
        <>
          <InspectorSection title="Appearance" defaultOpen>
            <ColorField
              label="Face color"
              value={design.background}
              disabled={!ready || mode === "always-on"}
              onChange={(background) => setDesign({ ...design, background })}
            />
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

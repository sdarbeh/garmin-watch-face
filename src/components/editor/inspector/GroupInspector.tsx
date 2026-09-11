import { Button, ColorField } from "@/components/ui";
import { LayerIcon, LockIcon, VisibilityIcon } from "@/icons";
import {
  FONT_FAMILIES,
  type FontFamily,
  type FontWeight,
} from "@/watchface/fonts";
import { isGraphic } from "@/watchface/layer-catalog";
import { layoutWarnings } from "@/watchface/render-model";
import { presentation, type Design, type ElementId } from "@/watchface/schema";
import { LayerActions } from "../LayerActions";
import type {
  DispatchEditorCommand,
  EditorLayerPatch,
} from "../model/commands";
import { layerLabel } from "../types";
import { layerSelectionState } from "../model/selection";
import { FontSizeField, TypographyAppearance } from "./TypographyFields";
import { InspectorSection } from "./InspectorSection";
import { PositionField } from "./PositionField";
import type { ReactNode } from "react";

export function GroupInspector({
  design,
  selected,
  selectedIds,
  ready,
  onCommand,
  modeSettings,
}: {
  design: Design;
  selected: ElementId;
  selectedIds: ElementId[];
  ready: boolean;
  onCommand: DispatchEditorCommand;
  modeSettings: ReactNode;
}) {
  const selection = layerSelectionState(design, selected, selectedIds);
  if (!selection || !selection.multiple) return null;
  const elements = [...selection.elements].reverse();
  const { primary, ids, locked, allVisible } = selection;
  const allTypographic = elements.every(
    (element) => !isGraphic(element.type, presentation(element).variant),
  );
  const allColorable = elements.every((element) => element.type !== "image");
  const center = {
    x: Math.round(
      elements.reduce((sum, element) => sum + element.x, 0) / elements.length,
    ),
    y: Math.round(
      elements.reduce((sum, element) => sum + element.y, 0) / elements.length,
    ),
  };
  const warnings = layoutWarnings(design);
  const disabled = !ready || locked;
  function updateElements(patch: EditorLayerPatch) {
    if (disabled) return;
    onCommand({ type: "layer.update-many", ids, patch });
  }

  return (
    <aside className="watchface-customizer" aria-label="Group properties">
      <h2 className="u-font-xl u-weight-semibold mb1">
        {elements.length} layers
      </h2>
      <p className="u-font-xs u-text-secondary mb3">
        Changes apply to every selected layer.
      </p>
      <InspectorSection title="Selected layers" defaultOpen>
        <div className="watchface-group-layers" role="list">
          {elements.map((element) => (
            <div
              className="watchface-group-layer u-flex u-items-center gap2 u-font-xs"
              role="listitem"
              key={element.id}
            >
              <LayerIcon type={element.type} size="sm" />
              <span>{layerLabel(element)}</span>
              {element.id === primary.id && (
                <span className="u-text-secondary">Primary</span>
              )}
            </div>
          ))}
        </div>
      </InspectorSection>
      {locked && (
        <p className="u-font-xs u-text-secondary mb3">
          Unlock the group to edit shared properties.
        </p>
      )}
      {allTypographic && (
        <InspectorSection title="Typography" defaultOpen>
          <label className="watchface-property-row ui-field u-font-xs mb2">
            Font
            <select
              disabled={disabled}
              value={primary.family}
              onChange={(event) => {
                const family = event.target.value as FontFamily;
                const weights: readonly number[] =
                  FONT_FAMILIES[family].weights;
                updateElements({
                  family,
                  weight: weights.includes(primary.weight)
                    ? primary.weight
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
                disabled || FONT_FAMILIES[primary.family].weights.length === 1
              }
              value={primary.weight}
              onChange={(event) =>
                updateElements({
                  weight: Number(event.target.value) as FontWeight,
                })
              }
            >
              {FONT_FAMILIES[primary.family].weights.map((weight) => (
                <option key={weight} value={weight}>
                  {weight === 400 ? "Regular" : "Bold"}
                </option>
              ))}
            </select>
          </label>
          <FontSizeField
            key={`${primary.id}-group-size`}
            value={primary.size}
            disabled={disabled}
            onChange={(size) => updateElements({ size })}
          />
          <TypographyAppearance
            key={`${primary.id}-group-appearance`}
            element={primary}
            disabled={disabled}
            onChange={updateElements}
          />
        </InspectorSection>
      )}
      {!allTypographic && allColorable && (
        <InspectorSection title="Appearance" defaultOpen>
          <div className="watchface-property-row u-font-xs">
            <span>Color</span>
            <ColorField
              label="Group color"
              value={primary.color}
              disabled={disabled}
              onChange={(color) => updateElements({ color })}
            />
          </div>
        </InspectorSection>
      )}
      <InspectorSection title="Position" defaultOpen>
        <div className="watchface-position-fields">
          {(["x", "y"] as const).map((axis) => (
            <PositionField
              key={`group-${axis}`}
              axis={axis}
              value={center[axis]}
              disabled={disabled}
              onChange={(value) =>
                onCommand({
                  type: "layer.move-many",
                  ids,
                  dx: axis === "x" ? value - center.x : 0,
                  dy: axis === "y" ? value - center.y : 0,
                })
              }
            />
          ))}
        </div>
        <p className="u-font-xs u-text-secondary">
          X and Y position the center of the group while preserving spacing.
        </p>
      </InspectorSection>
      <InspectorSection title="Layer state">
        <div className="u-grid gap2 watchface-inspector-actions__buttons">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() =>
              onCommand({
                type: "layer.set-visibility",
                ids,
                visible: !allVisible,
              })
            }
          >
            <VisibilityIcon visible={allVisible} size="sm" />
            {allVisible ? "Hide all" : "Show all"}
          </Button>
          <Button
            size="sm"
            disabled={!ready}
            onClick={() =>
              onCommand({
                type: "layer.set-lock",
                ids,
                locked: !locked,
              })
            }
          >
            <LockIcon locked={locked} size="sm" />
            {locked ? "Unlock all" : "Lock all"}
          </Button>
        </div>
      </InspectorSection>
      {warnings.length > 0 && (
        <InspectorSection title={`Layout warnings (${warnings.length})`}>
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </InspectorSection>
      )}
      <LayerActions
        design={design}
        selected={primary.id}
        selectedIds={ids}
        ready={ready}
        onCommand={onCommand}
      />
      {modeSettings}
    </aside>
  );
}

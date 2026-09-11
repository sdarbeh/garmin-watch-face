import { ColorField } from "@/components/ui";
import { LayerIcon } from "@/icons";
import { isGraphic } from "@/watchface/layer-catalog";
import type { DesignIssue } from "@/watchface/design-validation";
import { presentation, type Design, type ElementId } from "@/watchface/schema";
import { LayerActions } from "../LayerActions";
import type {
  DispatchEditorCommand,
  EditorLayerPatch,
} from "../model/commands";
import { layerLabel } from "../types";
import { layerSelectionState } from "../model/selection";
import { TypographyFields } from "./TypographyFields";
import { InspectorSection } from "./InspectorSection";
import { DesignChecks } from "./DesignChecks";
import { PositionField } from "./PositionField";
import type { ReactNode } from "react";
import { InspectorHeader } from "./InspectorHeader";
import { LayerStateSettings } from "./LayerStateSettings";
import { getDeviceById } from "@/devices/catalog";

export function GroupInspector({
  design,
  selected,
  selectedIds,
  ready,
  onCommand,
  modeSettings,
  issues,
  onIssueSelect,
}: {
  design: Design;
  selected: ElementId;
  selectedIds: ElementId[];
  ready: boolean;
  onCommand: DispatchEditorCommand;
  modeSettings: ReactNode;
  issues: DesignIssue[];
  onIssueSelect: (issue: DesignIssue) => void;
}) {
  const selection = layerSelectionState(design, selected, selectedIds);
  if (!selection || !selection.multiple) return null;
  const device = getDeviceById(design.device)!;
  const elements = [...selection.elements].reverse();
  const { primary, ids, locked, allVisible } = selection;
  const allLocked = elements.every((element) => element.locked);
  const someVisible = elements.some((element) => element.visible);
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
  const disabled = !ready || locked;
  function updateElements(patch: EditorLayerPatch) {
    if (disabled) return;
    onCommand({ type: "layer.update-many", ids, patch });
  }

  return (
    <aside className="watchface-customizer" aria-label="Group properties">
      <InspectorHeader
        title={`${elements.length} layers`}
        badge="Multi-select"
        description="Changes apply to every selected layer."
      />
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
        <p className="watchface-inspector-lock-notice">
          Unlock the group to edit shared properties.
        </p>
      )}
      {allTypographic && (
        <InspectorSection title="Style">
          <TypographyFields
            key={`${primary.id}-group-typography`}
            element={primary}
            disabled={disabled}
            onChange={updateElements}
          />
        </InspectorSection>
      )}
      {!allTypographic && allColorable && (
        <InspectorSection title="Appearance">
          <div className="watchface-property-row">
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
      <InspectorSection title="Position">
        <div className="watchface-position-fields">
          {(["x", "y"] as const).map((axis) => (
            <PositionField
              key={`group-${axis}`}
              axis={axis}
              value={center[axis]}
              disabled={disabled}
              min={0}
              max={axis === "x" ? device.width : device.height}
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
      <LayerStateSettings
        visible={allVisible}
        visibilityMixed={someVisible && !allVisible}
        locked={allLocked}
        lockMixed={locked && !allLocked}
        ready={ready}
        onVisibilityChange={(visible) =>
          onCommand({ type: "layer.set-visibility", ids, visible })
        }
        onLockChange={(nextLocked) =>
          onCommand({ type: "layer.set-lock", ids, locked: nextLocked })
        }
      />
      <DesignChecks
        design={design}
        issues={issues}
        onIssueSelect={onIssueSelect}
      />
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

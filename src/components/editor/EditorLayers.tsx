import { supportedLayers } from "@/watchface/capabilities";
import { getDeviceById } from "@/devices/catalog";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayerIcon, VisibilityIcon, LockIcon, PlusIcon } from "@/icons";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "./model/commands";
import type { EditorContextRequest } from "./model/context-menu";
import { LAYER_LABELS, layerLabel, type EditorSelection } from "./types";

export function EditorLayers({
  selected,
  selectedIds,
  onSelect,
  onOpenContextMenu,
  design,
  onCommand,
  ready,
}: {
  selected: EditorSelection;
  selectedIds: string[];
  onSelect: (selection: EditorSelection, additive?: boolean) => void;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  design: Design;
  onCommand: DispatchEditorCommand;
  ready: boolean;
}) {
  const supported = supportedLayers(getDeviceById(design.device)!);
  const [adding, setAdding] = useState(false);
  return (
    <aside className="watchface-layers" aria-label="Layers">
      <div
        className="watchface-layer-tabs"
        role="group"
        aria-label="Sidebar view"
      >
        <Button
          variant="ghost"
          size="sm"
          active={adding}
          aria-pressed={adding}
          onClick={() => setAdding(true)}
        >
          Add
        </Button>
        <Button
          variant="ghost"
          size="sm"
          active={!adding}
          aria-pressed={!adding}
          onClick={() => setAdding(false)}
        >
          Layers
        </Button>
      </div>
      <div className="watchface-layer-list">
        {adding ? (
          <div className="u-grid gap2" role="group" aria-label="Add element">
            {supported.map((type, index) => (
              <Fragment key={type}>
                <Button
                  className="watchface-layer"
                  variant="ghost"
                  disabled={!ready || design.elements.length >= MAX_ELEMENTS}
                  onClick={() => {
                    onCommand({ type: "layer.add", layerType: type });
                    setAdding(false);
                  }}
                >
                  <LayerIcon type={type} size="sm" />
                  {LAYER_LABELS[type]}
                </Button>
                {index < supported.length - 1 && (
                  <div className="watchface-layer-divider" aria-hidden="true" />
                )}
              </Fragment>
            ))}
            {design.elements.length >= MAX_ELEMENTS && (
              <p className="u-font-xs u-text-secondary">
                Maximum of {MAX_ELEMENTS} elements reached.
              </p>
            )}
          </div>
        ) : (
          <div role="group" aria-label="Select a layer">
            {[...design.elements].reverse().map((item) => (
              <Fragment key={item.id}>
                <div
                  className="watchface-layer-row"
                  data-selected={selectedIds.includes(item.id)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (!selectedIds.includes(item.id)) onSelect(item.id);
                    onOpenContextMenu({
                      target: item.id,
                      x: event.clientX,
                      y: event.clientY,
                    });
                  }}
                >
                  <Button
                    variant="ghost"
                    className="watchface-layer-select"
                    title={layerLabel(item)}
                    aria-pressed={selectedIds.includes(item.id)}
                    onClick={(event) =>
                      onSelect(
                        item.id,
                        event.shiftKey || event.metaKey || event.ctrlKey,
                      )
                    }
                  >
                    <LayerIcon type={item.type} size="sm" />
                    <span>{layerLabel(item)}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconOnly
                    disabled={!ready || item.locked}
                    aria-label={`${item.visible ? "Hide" : "Show"} ${layerLabel(item)}`}
                    aria-pressed={!item.visible}
                    onClick={() =>
                      onCommand({
                        type: "layer.toggle-visibility",
                        id: item.id,
                      })
                    }
                  >
                    <VisibilityIcon visible={item.visible} size="sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconOnly
                    disabled={!ready}
                    aria-label={`${item.locked ? "Unlock" : "Lock"} ${layerLabel(item)}`}
                    aria-pressed={item.locked}
                    onClick={() =>
                      onCommand({ type: "layer.toggle-lock", id: item.id })
                    }
                  >
                    <LockIcon locked={item.locked} size="sm" />
                  </Button>
                </div>
                <div className="watchface-layer-divider" aria-hidden="true" />
              </Fragment>
            ))}
            <Button
              variant="ghost"
              className="watchface-layer"
              aria-pressed={selected === "background"}
              onClick={() => onSelect("background")}
              onContextMenu={(event) => {
                event.preventDefault();
                onSelect("background");
                onOpenContextMenu({
                  target: "background",
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
            >
              <LayerIcon type="background" size="sm" />
              Background
            </Button>
          </div>
        )}
      </div>
      <Button
        className="watchface-add-element"
        size="sm"
        disabled={!ready || design.elements.length >= MAX_ELEMENTS}
        onClick={() => setAdding(true)}
      >
        <PlusIcon size="sm" />
        Add element
      </Button>
    </aside>
  );
}

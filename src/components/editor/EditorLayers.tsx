import { supportedLayers } from "@/watchface/capabilities";
import { getDeviceById } from "@/devices/catalog";
import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayerIcon, PlusIcon, SearchIcon } from "@/icons";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "./model/commands";
import type { EditorContextRequest } from "./model/context-menu";
import {
  LAYER_LABELS,
  defaultLayerLabel,
  layerLabel,
  type EditorSelection,
} from "./types";
import { LayerListRow } from "./LayerListRow";
import { matchesLayerQuery, searchLayerTypes } from "./model/layer-search";

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
  const [layerQuery, setLayerQuery] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    placement: "above" | "below";
  } | null>(null);
  const visibleLayers = [...design.elements].reverse().filter((element) => {
    return matchesLayerQuery(element.type, layerQuery, [
      layerLabel(element),
      defaultLayerLabel(element),
    ]);
  });
  const addableLayers = searchLayerTypes(supported, addQuery);
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
          onClick={() => {
            setAdding(false);
            setAddQuery("");
          }}
        >
          Layers
        </Button>
      </div>
      <div className="watchface-layer-list">
        {adding ? (
          <div className="u-grid gap2" role="group" aria-label="Add element">
            <label className="ui-search watchface-layer-search">
              <span className="u-sr-only">Search elements to add</span>
              <SearchIcon size="sm" />
              <input
                type="search"
                autoFocus
                placeholder="Search elements"
                value={addQuery}
                onChange={(event) => setAddQuery(event.target.value)}
              />
            </label>
            {addableLayers.map((type, index) => (
              <Fragment key={type}>
                <Button
                  className="watchface-layer"
                  variant="ghost"
                  disabled={!ready || design.elements.length >= MAX_ELEMENTS}
                  onClick={() => {
                    onCommand({ type: "layer.add", layerType: type });
                    setAddQuery("");
                    setAdding(false);
                  }}
                >
                  <LayerIcon type={type} size="sm" />
                  {LAYER_LABELS[type]}
                </Button>
                {index < addableLayers.length - 1 && (
                  <div className="watchface-layer-divider" aria-hidden="true" />
                )}
              </Fragment>
            ))}
            {addableLayers.length === 0 && (
              <p className="u-font-xs u-text-secondary p2" role="status">
                No elements match “{addQuery}”.
              </p>
            )}
            {design.elements.length >= MAX_ELEMENTS && (
              <p className="u-font-xs u-text-secondary">
                Maximum of {MAX_ELEMENTS} elements reached.
              </p>
            )}
          </div>
        ) : (
          <div role="group" aria-label="Select a layer">
            <label className="ui-search watchface-layer-search">
              <span className="u-sr-only">Search layers</span>
              <SearchIcon size="sm" />
              <input
                type="search"
                placeholder="Search layers"
                value={layerQuery}
                onChange={(event) => setLayerQuery(event.target.value)}
              />
            </label>
            {visibleLayers.map((item) => {
              const dragIds = selectedIds.includes(item.id)
                ? selectedIds
                : [item.id];
              const dragDisabled = dragIds.some(
                (id) =>
                  design.elements.find((element) => element.id === id)?.locked,
              );
              return (
                <Fragment key={item.id}>
                  <LayerListRow
                    item={item}
                    selectedIds={selectedIds}
                    ready={ready}
                    draggedIds={draggedIds}
                    dragDisabled={dragDisabled}
                    dropTarget={dropTarget}
                    onSelect={onSelect}
                    onCommand={onCommand}
                    onOpenContextMenu={onOpenContextMenu}
                    onDragStart={setDraggedIds}
                    onDragOver={setDropTarget}
                    onDrop={() => {
                      if (dropTarget && draggedIds.length)
                        onCommand({
                          type: "layer.place",
                          ids: draggedIds,
                          targetId: dropTarget.id,
                          placement: dropTarget.placement,
                        });
                      setDraggedIds([]);
                      setDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIds([]);
                      setDropTarget(null);
                    }}
                  />
                  <div className="watchface-layer-divider" aria-hidden="true" />
                </Fragment>
              );
            })}
            {visibleLayers.length === 0 && (
              <p className="u-font-xs u-text-secondary p2" role="status">
                No layers match “{layerQuery}”.
              </p>
            )}
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

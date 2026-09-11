"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, Drawer } from "@/components/ui";
import { LayerIcon, PlusIcon, SearchIcon } from "@/icons";
import type { Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "@/components/editor/model/commands";
import type { EditorContextRequest } from "@/components/editor/model/context-menu";
import { matchesLayerQuery } from "@/components/editor/model/layer-search";
import {
  defaultLayerLabel,
  layerLabel,
  type EditorSelection,
} from "@/components/editor/types";
import {
  LayerListItem,
  type LayerDropTarget,
} from "./LayerListItem";

export function LayersScreen({
  selected,
  selectedIds,
  design,
  ready,
  addDisabled,
  onSelect,
  onCommand,
  onOpenContextMenu,
  onOpenAdd,
}: {
  selected: EditorSelection;
  selectedIds: string[];
  design: Design;
  ready: boolean;
  addDisabled: boolean;
  onSelect: (selection: EditorSelection, additive?: boolean) => void;
  onCommand: DispatchEditorCommand;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  onOpenAdd: () => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const searchLabelId = useId();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<LayerDropTarget | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLayers = [...design.elements]
    .reverse()
    .filter((element) =>
      matchesLayerQuery(element.type, query, [
        layerLabel(element),
        defaultLayerLabel(element),
      ]),
    );
  const showBackground =
    !normalizedQuery ||
    "background canvas"
      .split(" ")
      .some((term) => term.startsWith(normalizedQuery));

  useEffect(() => {
    if (!searching) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searching]);

  function closeSearch() {
    setSearching(false);
    setQuery("");
  }

  function finishDrag() {
    setDraggedIds([]);
    setDropTarget(null);
  }

  return (
    <section className="watchface-left-rail__screen" aria-labelledby={titleId}>
      <div className="watchface-left-rail__toolbar u-grid gap1 p1 u-bg-subtle u-radius-small">
        <div className="watchface-left-rail__active u-flex u-items-center gap1 u-radius-small">
          <h2 id={titleId} className="u-font-md u-weight-bold u-flex-1 px3">
            Layers
          </h2>
          <Button
            size="xs"
            variant="ghost"
            iconOnly
            active={searching}
            aria-label={searching ? "Close layer search" : "Search layers"}
            aria-pressed={searching}
            onClick={() => {
              if (searching) closeSearch();
              else setSearching(true);
            }}
          >
            <SearchIcon size="sm" />
          </Button>
        </div>
        <Button
          className="watchface-left-rail__add-tab"
          size="md"
          variant="ghost"
          iconOnly
          disabled={addDisabled}
          aria-label="Add element"
          onClick={onOpenAdd}
        >
          <PlusIcon size="md" />
        </Button>
      </div>

      <div className="watchface-left-rail__scroll">
        <div data-open={searching}>
          <Drawer open={searching} labelledBy={searchLabelId}>
            <label className="ui-search mb3" id={searchLabelId}>
              <span className="u-sr-only">Search layers</span>
              <SearchIcon size="sm" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search layers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </Drawer>
        </div>

        <div role="group" aria-label="Select a layer">
          {visibleLayers.map((item) => {
            const dragIds = selectedIds.includes(item.id)
              ? selectedIds
              : [item.id];
            const dragDisabled = dragIds.some(
              (id) =>
                design.elements.find((element) => element.id === id)?.locked,
            );
            return (
              <LayerListItem
                key={item.id}
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
                  finishDrag();
                }}
                onDragEnd={finishDrag}
              />
            );
          })}
          {visibleLayers.length === 0 && !showBackground && (
            <p className="u-font-xs u-text-secondary p2" role="status">
              No layers match “{query}”.
            </p>
          )}
          {showBackground && (
            <Button
              variant="ghost"
              className="watchface-layer-item watchface-layer-item--background"
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
          )}
        </div>
      </div>

      <Button
        className="watchface-left-rail__add-button u-ring"
        size="md"
        disabled={addDisabled}
        onClick={onOpenAdd}
      >
        <PlusIcon size="sm" />
        Add element
      </Button>
    </section>
  );
}

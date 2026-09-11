import { Button } from "@/components/ui/button";
import { GripIcon, LayerIcon, LockIcon, VisibilityIcon } from "@/icons";
import type { FaceElement } from "@/watchface/schema";
import type { DispatchEditorCommand } from "./model/commands";
import type { EditorContextRequest } from "./model/context-menu";
import { defaultLayerLabel, layerLabel } from "./types";

interface DropTarget {
  id: string;
  placement: "above" | "below";
}

export function LayerListRow({
  item,
  selectedIds,
  ready,
  draggedIds,
  dragDisabled,
  dropTarget,
  onSelect,
  onCommand,
  onOpenContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: FaceElement;
  selectedIds: string[];
  ready: boolean;
  draggedIds: string[];
  dragDisabled: boolean;
  dropTarget: DropTarget | null;
  onSelect: (id: string, additive?: boolean) => void;
  onCommand: DispatchEditorCommand;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  onDragStart: (ids: string[]) => void;
  onDragOver: (target: DropTarget) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const selected = selectedIds.includes(item.id);
  const dragIds = selected ? selectedIds : [item.id];
  const customName = Boolean(item.name?.trim());

  return (
    <div
      className="watchface-layer-row"
      data-selected={selected}
      data-drop={dropTarget?.id === item.id ? dropTarget.placement : undefined}
      onDragOver={(event) => {
        if (!draggedIds.length || draggedIds.includes(item.id)) return;
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        onDragOver({
          id: item.id,
          placement:
            event.clientY < bounds.top + bounds.height / 2 ? "above" : "below",
        });
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (!selected) onSelect(item.id);
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
        aria-pressed={selected}
        onClick={(event) =>
          onSelect(item.id, event.shiftKey || event.metaKey || event.ctrlKey)
        }
      >
        <LayerIcon type={item.type} size="sm" />
        <span className="watchface-layer-copy">
          <span>{layerLabel(item)}</span>
          <small>
            {customName ? `${defaultLayerLabel(item)} · ` : ""}X {item.x} · Y{" "}
            {item.y}
          </small>
        </span>
      </Button>
      <span
        className="watchface-layer-grip"
        data-disabled={dragDisabled}
        draggable={!dragDisabled}
        title={
          dragDisabled
            ? "Unlock the selected layers to reorder"
            : "Drag to reorder"
        }
        aria-hidden="true"
        onDragStart={(event) => {
          if (dragDisabled) {
            event.preventDefault();
            return;
          }
          if (!selected) onSelect(item.id);
          onDragStart(dragIds);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
        }}
        onDragEnd={onDragEnd}
      >
        <GripIcon size="sm" />
      </span>
      <Button
        variant="ghost"
        size="xs"
        iconOnly
        disabled={!ready || item.locked}
        aria-label={`${item.visible ? "Hide" : "Show"} ${layerLabel(item)}`}
        aria-pressed={!item.visible}
        onClick={() =>
          onCommand({ type: "layer.toggle-visibility", id: item.id })
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
        onClick={() => onCommand({ type: "layer.toggle-lock", id: item.id })}
      >
        <LockIcon locked={item.locked} size="sm" />
      </Button>
    </div>
  );
}

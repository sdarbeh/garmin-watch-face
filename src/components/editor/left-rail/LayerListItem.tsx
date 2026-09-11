import { Button } from "@/components/ui/button";
import { GripIcon, LockIcon, VisibilityIcon } from "@/icons";
import type { FaceElement } from "@/watchface/schema";
import type { DispatchEditorCommand } from "@/components/editor/model/commands";
import type { EditorContextRequest } from "@/components/editor/model/context-menu";
import { layerLabel } from "@/components/editor/types";

export interface LayerDropTarget {
  id: string;
  placement: "above" | "below";
}

export function LayerListItem({
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
  dropTarget: LayerDropTarget | null;
  onSelect: (id: string, additive?: boolean) => void;
  onCommand: DispatchEditorCommand;
  onOpenContextMenu: (request: EditorContextRequest) => void;
  onDragStart: (ids: string[]) => void;
  onDragOver: (target: LayerDropTarget) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const selected = selectedIds.includes(item.id);
  const dragIds = selected ? selectedIds : [item.id];
  const label = layerLabel(item);

  return (
    <div
      className="watchface-layer-item"
      data-selected={selected}
      data-visible={item.visible}
      data-locked={item.locked}
      data-draggable={!dragDisabled}
      data-dragging={draggedIds.includes(item.id)}
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
        className="watchface-layer-item__select"
        aria-pressed={selected}
        draggable={!dragDisabled}
        onClick={(event) =>
          onSelect(item.id, event.shiftKey || event.metaKey || event.ctrlKey)
        }
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
        <span className="watchface-layer-item__label">{label}</span>
      </Button>
      <Button
        variant="ghost"
        size="xs"
        iconOnly
        className="watchface-layer-item__action"
        disabled={!ready || item.locked}
        aria-label={`${item.visible ? "Hide" : "Show"} ${label}`}
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
        className="watchface-layer-item__action"
        disabled={!ready}
        aria-label={`${item.locked ? "Unlock" : "Lock"} ${label}`}
        aria-pressed={item.locked}
        onClick={() => onCommand({ type: "layer.toggle-lock", id: item.id })}
      >
        <LockIcon locked={item.locked} size="sm" />
      </Button>
    </div>
  );
}

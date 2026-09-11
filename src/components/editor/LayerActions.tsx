import { InspectorSection } from "./inspector/InspectorSection";
import { DuplicateIcon, DeleteIcon } from "@/icons";
import { Button } from "@/components/ui";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "./model/commands";
import { layerSelectionState } from "./model/selection";

export function LayerActions({
  design,
  selected,
  selectedIds = [],
  ready,
  onCommand,
}: {
  design: Design;
  selected: string;
  selectedIds?: string[];
  ready: boolean;
  onCommand: DispatchEditorCommand;
}) {
  const selection = layerSelectionState(design, selected, selectedIds);
  if (!selection) return null;
  const { ids, elements, multiple, locked, atFront, atBack } = selection;
  function arrange(placement: "forward" | "backward") {
    if (multiple) onCommand({ type: "layer.reorder-many", ids, placement });
    else onCommand({ type: "layer.reorder", id: selected, placement });
  }
  return (
    <>
      <InspectorSection title="Arrange">
        <div className="u-flex gap2">
          <Button
            size="sm"
            disabled={!ready || locked || atFront}
            title="Bring forward (⌘/Ctrl + ])"
            aria-keyshortcuts="Meta+] Control+]"
            onClick={() => arrange("forward")}
          >
            Bring forward
          </Button>
          <Button
            size="sm"
            disabled={!ready || locked || atBack}
            title="Send backward (⌘/Ctrl + [)"
            aria-keyshortcuts="Meta+[ Control+["
            onClick={() => arrange("backward")}
          >
            Send backward
          </Button>
        </div>
      </InspectorSection>
      <div className="watchface-layer-action-buttons">
        <Button
          size="sm"
          disabled={
            !ready ||
            locked ||
            design.elements.length + elements.length > MAX_ELEMENTS
          }
          title="Duplicate (⌘/Ctrl + D)"
          aria-keyshortcuts="Meta+D Control+D"
          onClick={() =>
            multiple
              ? onCommand({ type: "layer.duplicate-many", ids })
              : onCommand({ type: "layer.duplicate", id: selected })
          }
        >
          <DuplicateIcon size="sm" />
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!ready || locked}
          title="Delete (Delete/Backspace)"
          aria-keyshortcuts="Delete Backspace"
          onClick={() =>
            multiple
              ? onCommand({ type: "layer.delete-many", ids })
              : onCommand({ type: "layer.delete", id: selected })
          }
        >
          <DeleteIcon size="sm" />
          Delete
        </Button>
      </div>
    </>
  );
}

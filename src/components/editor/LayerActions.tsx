import { InspectorSection } from "./inspector/InspectorSection";
import { DuplicateIcon, DeleteIcon } from "@/icons";
import { Button } from "@/components/ui";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import type { DispatchEditorCommand } from "./model/commands";

export function LayerActions({
  design,
  selected,
  ready,
  onCommand,
}: {
  design: Design;
  selected: string;
  ready: boolean;
  onCommand: DispatchEditorCommand;
}) {
  const element = design.elements.find((item) => item.id === selected);
  if (!element) return null;
  const index = design.elements.indexOf(element);
  return (
    <div className="watchface-inspector-actions">
      <InspectorSection title="Arrange">
        <div className="u-flex gap2">
          <Button
            size="sm"
            disabled={
              !ready || element.locked || index === design.elements.length - 1
            }
            title="Bring forward (⌘/Ctrl + ])"
            aria-keyshortcuts="Meta+] Control+]"
            onClick={() =>
              onCommand({
                type: "layer.reorder",
                id: selected,
                placement: "forward",
              })
            }
          >
            Bring forward
          </Button>
          <Button
            size="sm"
            disabled={!ready || element.locked || index === 0}
            title="Send backward (⌘/Ctrl + [)"
            aria-keyshortcuts="Meta+[ Control+["
            onClick={() =>
              onCommand({
                type: "layer.reorder",
                id: selected,
                placement: "backward",
              })
            }
          >
            Send backward
          </Button>
        </div>
      </InspectorSection>
      <div className="u-grid gap2 watchface-inspector-actions__buttons">
        <Button
          size="sm"
          disabled={
            !ready || element.locked || design.elements.length >= MAX_ELEMENTS
          }
          title="Duplicate (⌘/Ctrl + D)"
          aria-keyshortcuts="Meta+D Control+D"
          onClick={() => onCommand({ type: "layer.duplicate", id: selected })}
        >
          <DuplicateIcon size="sm" />
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!ready || element.locked}
          title="Delete (Delete/Backspace)"
          aria-keyshortcuts="Delete Backspace"
          onClick={() => onCommand({ type: "layer.delete", id: selected })}
        >
          <DeleteIcon size="sm" />
          Delete
        </Button>
      </div>
    </div>
  );
}

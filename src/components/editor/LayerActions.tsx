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
            onClick={() =>
              onCommand({
                type: "layer.reorder",
                id: selected,
                direction: 1,
              })
            }
          >
            Bring forward
          </Button>
          <Button
            size="sm"
            disabled={!ready || element.locked || index === 0}
            onClick={() =>
              onCommand({
                type: "layer.reorder",
                id: selected,
                direction: -1,
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
          onClick={() => onCommand({ type: "layer.duplicate", id: selected })}
        >
          <DuplicateIcon size="sm" />
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!ready || element.locked}
          onClick={() => onCommand({ type: "layer.delete", id: selected })}
        >
          <DeleteIcon size="sm" />
          Delete
        </Button>
      </div>
    </div>
  );
}

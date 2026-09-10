import { InspectorSection } from "./inspector/InspectorSection";
import { DuplicateIcon, DeleteIcon } from "@/icons";
import { Button } from "@/components/ui";
import { MAX_ELEMENTS, type Design } from "@/watchface/schema";
import { duplicateLayer, reorderLayer } from "./model/layers";

export function LayerActions({
  design,
  selected,
  ready,
  onChange,
  onSelect,
}: {
  design: Design;
  selected: string;
  ready: boolean;
  onChange: (design: Design) => void;
  onSelect: (id: string) => void;
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
            onClick={() => onChange(reorderLayer(design, selected, 1))}
          >
            Bring forward
          </Button>
          <Button
            size="sm"
            disabled={!ready || element.locked || index === 0}
            onClick={() => onChange(reorderLayer(design, selected, -1))}
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
          onClick={() => {
            const id = crypto.randomUUID();
            onChange(duplicateLayer(design, selected, id));
            onSelect(id);
          }}
        >
          <DuplicateIcon size="sm" />
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!ready || element.locked}
          onClick={() => {
            onChange({
              ...design,
              elements: design.elements.filter((item) => item.id !== selected),
            });
            onSelect("background");
          }}
        >
          <DeleteIcon size="sm" />
          Delete
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button, ColorField } from "@/components/ui";
import { TextAlignmentIcon } from "@/icons";
import { type FaceElement } from "@/watchface/schema";
import { FONT_SIZES, type FontSize, type Alignment } from "@/watchface/fonts";

export function FontSizeField({
  value,
  disabled,
  onChange,
}: {
  value: FontSize;
  disabled: boolean;
  onChange: (size: FontSize) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="watchface-property-row ui-field u-font-xs mb2">
      Size
      <input
        type="number"
        min={24}
        max={120}
        step={8}
        value={draft ?? value}
        disabled={disabled}
        onChange={(event) => {
          const text = event.target.value;
          const next = Number(text);
          if (text !== "" && (FONT_SIZES as readonly number[]).includes(next)) {
            setDraft(null);
            onChange(next as FontSize);
          } else {
            setDraft(text);
          }
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
    </label>
  );
}
export function TypographyAppearance({
  element,
  disabled,
  onChange,
}: {
  element: FaceElement;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
}) {
  return (
    <>
      <div className="watchface-property-row u-font-xs mb2">
        <span>Color</span>
        <ColorField
          label="Text color"
          value={element.color}
          disabled={disabled}
          onChange={(color) => onChange({ color })}
        />
      </div>
      <div className="watchface-property-row u-font-xs">
        <span>Alignment</span>
        <div
          className="watchface-segments"
          role="group"
          aria-label="Text alignment"
        >
          {(["left", "center", "right"] as Alignment[]).map((alignment) => (
            <Button
              key={alignment}
              variant="ghost"
              size="sm"
              disabled={disabled}
              active={element.alignment === alignment}
              aria-pressed={element.alignment === alignment}
              aria-label={`Align ${alignment}`}
              onClick={() => onChange({ alignment })}
            >
              <TextAlignmentIcon alignment={alignment} size="sm" />
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}

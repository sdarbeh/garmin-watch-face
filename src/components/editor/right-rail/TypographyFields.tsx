import { useState } from "react";
import { ColorField, SegmentedControl } from "@/components/ui";
import { TextAlignmentIcon } from "@/icons";
import { type FaceElement } from "@/watchface/schema";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  type Alignment,
  type FontFamily,
  type FontSize,
  type FontWeight,
} from "@/watchface/fonts";

export function TypographyFields({
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
      <label className="watchface-property-row ui-field">
        Font
        <select
          disabled={disabled}
          value={element.family}
          onChange={(event) => {
            const family = event.target.value as FontFamily;
            const weights: readonly number[] = FONT_FAMILIES[family].weights;
            onChange({
              family,
              weight: weights.includes(element.weight) ? element.weight : 400,
            });
          }}
        >
          {Object.entries(FONT_FAMILIES).map(([key, font]) => (
            <option key={key} value={key}>
              {font.name}
            </option>
          ))}
        </select>
      </label>
      <label className="watchface-property-row ui-field">
        Weight
        <select
          disabled={
            disabled || FONT_FAMILIES[element.family].weights.length === 1
          }
          value={element.weight}
          onChange={(event) =>
            onChange({ weight: Number(event.target.value) as FontWeight })
          }
        >
          {FONT_FAMILIES[element.family].weights.map((weight) => (
            <option key={weight} value={weight}>
              {weight === 400 ? "Regular" : "Bold"}
            </option>
          ))}
        </select>
      </label>
      <FontSizeField
        value={element.size}
        disabled={disabled}
        onChange={(size) => onChange({ size })}
      />
      <TypographyAppearance
        element={element}
        disabled={disabled}
        onChange={onChange}
      />
    </>
  );
}

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
    <label className="watchface-property-row ui-field">
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
      <div className="watchface-property-row">
        <span>Color</span>
        <ColorField
          label="Text color"
          value={element.color}
          disabled={disabled}
          onChange={(color) => onChange({ color })}
        />
      </div>
      <div className="watchface-property-row">
        <span>Alignment</span>
        <SegmentedControl
          label="Text alignment"
          options={(["left", "center", "right"] as Alignment[]).map(
            (alignment) => ({
              value: alignment,
              label: <TextAlignmentIcon alignment={alignment} size="sm" />,
              ariaLabel: `Align ${alignment}`,
            }),
          )}
          value={element.alignment}
          disabled={disabled}
          onChange={(alignment) => onChange({ alignment })}
        />
      </div>
    </>
  );
}

import { Button } from "@/components/ui/button";
import { cx } from "@/utils/css";

type ColorSwatchesProps<Color extends string> = {
  label: string;
  colors: readonly Color[];
  value: Color;
  disabled?: boolean;
  onChange: (color: Color) => void;
};
export function ColorSwatches<Color extends string>({
  label,
  colors,
  value,
  disabled,
  onChange,
}: ColorSwatchesProps<Color>) {
  return (
    <fieldset className="ui-color-swatches mb5" disabled={disabled}>
      <legend className="u-font-md mb3">{label}</legend>
      <div className="u-flex u-flex-wrap gap3">
        {colors.map((color) => (
          <Button
            variant="ghost"
            key={color}
            type="button"
            className={cx(
              "ui-color-swatches__option u-circle",
              ["#000000", "#00AAAA"].includes(color) &&
                "ui-color-swatches__option--dark",
            )}
            style={{ backgroundColor: color }}
            aria-label={`${label} ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
          >
            <span aria-hidden="true">{value === color ? "✓" : ""}</span>
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

import { useState } from "react";
import { cx } from "@/utils/css";
/** Keep incomplete typing local while committing valid values immediately. */
export function DimensionField({
  label,
  value,
  min,
  max,
  disabled,
  compact = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label
      className={cx(
        compact ? "watchface-position-field" : "watchface-property-row",
        "ui-field",
      )}
    >
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={draft ?? value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const parsed = Number(next);
          if (
            next &&
            Number.isInteger(parsed) &&
            parsed >= min &&
            parsed <= max
          )
            onChange(parsed);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

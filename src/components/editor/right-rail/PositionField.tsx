import { useState } from "react";

export function PositionField({
  axis,
  value,
  disabled,
  min = 50,
  max = 404,
  onChange,
}: {
  axis: "x" | "y";
  value: number;
  disabled: boolean;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  function commit() {
    if (draft !== null && draft.trim() !== "") {
      const next = Number(draft);
      if (Number.isInteger(next) && next >= min && next <= max) onChange(next);
    }
    setDraft(null);
  }
  return (
    <label className="watchface-position-field ui-field">
      <span>{axis.toUpperCase()}</span>
      <input
        type="number"
        aria-label={
          axis === "x"
            ? "Horizontal position in pixels"
            : "Vertical position in pixels"
        }
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        value={draft ?? value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(null);
          }
        }}
      />
    </label>
  );
}

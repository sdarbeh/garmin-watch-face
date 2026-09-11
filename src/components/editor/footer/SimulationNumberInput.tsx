import { useState } from "react";
import {
  clampSimulationNumber,
  isSimulationNumberValid,
  type SimulationNumberConstraint,
} from "@/components/editor/model/simulation-constraints";

function numberFromDraft(draft: string | null, value: number | null) {
  if (draft === null) return value ?? Number.NaN;
  if (!draft.trim()) return Number.NaN;
  return Number(draft);
}

export function SimulationNumberInput({
  id,
  label,
  value,
  constraint,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  constraint: SimulationNumberConstraint;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const draftValue = numberFromDraft(draft, value);
  const invalid =
    !disabled && !isSimulationNumberValid(draftValue, constraint);
  const range = `${constraint.min} to ${constraint.max}`;

  function commitDraft() {
    if (draft !== null && Number.isFinite(draftValue)) {
      onChange(clampSimulationNumber(draftValue, constraint));
    }
    setDraft(null);
  }

  return (
    <input
      id={id}
      aria-label={label}
      aria-invalid={invalid}
      title={`${label}: ${range}`}
      type="number"
      min={constraint.min}
      max={constraint.max}
      step={constraint.step}
      disabled={disabled}
      value={draft ?? value ?? ""}
      onChange={(event) => {
        const nextDraft = event.target.value;
        const nextValue = event.target.valueAsNumber;
        setDraft(nextDraft);
        if (isSimulationNumberValid(nextValue, constraint)) onChange(nextValue);
      }}
      onBlur={commitDraft}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(null);
        }
      }}
    />
  );
}

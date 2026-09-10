import {
  COMPLICATIONS,
  type ComplicationSource,
} from "@/watchface/complications";
import type { Simulation } from "./model/simulation";
export function ComplicationSimulation({
  source,
  values,
  onChange,
  disabled,
}: {
  source: ComplicationSource;
  values: Simulation;
  onChange: (values: Simulation) => void;
  disabled: boolean;
}) {
  const definition = COMPLICATIONS[source];
  const stored = values[source];
  const missing = !Number.isFinite(stored);
  const sample = stored;
  const update = (value: number | null) =>
    onChange({
      ...values,
      [source]: value ?? NaN,
    });
  return (
    <>
      <label
        htmlFor="complication-sample"
        className="u-font-xs u-text-secondary"
      >
        Simulate
      </label>
      <div className="watchface-footer__value">
        <input
          id="complication-sample"
          aria-label={`Simulate ${definition.label.toLowerCase()}`}
          title={`${definition.label}${definition.unit}`}
          type="number"
          min={0}
          max={999999}
          step="any"
          disabled={disabled || missing}
          value={missing ? "" : sample}
          onChange={(event) => {
            const value = event.target.valueAsNumber;
            if (Number.isFinite(value) && value >= 0 && value <= 999999)
              update(value);
          }}
        />
      </div>
      <label className="u-font-xs u-text-secondary">
        <input
          type="checkbox"
          disabled={disabled}
          checked={missing}
          onChange={(event) =>
            update(
              event.target.checked
                ? null
                : definition.sample / definition.divisor,
            )
          }
        />{" "}
        No data
      </label>
    </>
  );
}

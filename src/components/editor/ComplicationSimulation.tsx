import {
  COMPLICATIONS,
  type ComplicationSource,
} from "@/watchface/complications";
import type { Simulation } from "./model/simulation";
import { METRIC_SIMULATION_CONSTRAINTS } from "./model/simulation-constraints";
import { SimulationNumberInput } from "./footer/SimulationNumberInput";

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
  const stored = values.complicationValues?.[source];
  const missing = stored === null;
  const rawValue = stored ?? definition.sample;
  const sample = missing ? null : rawValue / definition.divisor;
  const update = (value: number | null) =>
    onChange({
      ...values,
      complicationValues: {
        ...values.complicationValues,
        [source]: value,
      },
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
        <SimulationNumberInput
          key={source}
          id="complication-sample"
          label={`Simulate ${definition.label.toLowerCase()}`}
          disabled={disabled || missing}
          value={sample}
          constraint={METRIC_SIMULATION_CONSTRAINTS[source]}
          onChange={(value) => update(value * definition.divisor)}
        />
      </div>
      <label className="u-font-xs u-text-secondary">
        <input
          type="checkbox"
          disabled={disabled}
          checked={missing}
          onChange={(event) =>
            update(event.target.checked ? null : definition.sample)
          }
        />{" "}
        No data
      </label>
    </>
  );
}

import type { ComplicationSource } from "@/watchface/complications";
import type { Metric } from "@/watchface/layer-catalog";
import type { ElementType } from "@/watchface/schema";
import { STATUS_SOURCES, type StatusSource } from "@/watchface/status-sources";
import { ComplicationSimulation } from "./ComplicationSimulation";
import { SimulationControl } from "./SimulationControl";
import { WeatherSimulation, hasWeatherSimulation } from "./WeatherSimulation";
import type {
  DisplayMode,
  Simulation,
} from "@/components/editor/model/simulation";

export function FooterSimulationControls({
  ready,
  simulation,
  onSimulationChange,
  selectedType,
  selectedVariant,
  selectedComplication,
  mode,
}: {
  ready: boolean;
  simulation: Simulation;
  onSimulationChange: (values: Simulation) => void;
  selectedType: ElementType | Metric | "background";
  selectedVariant: string;
  selectedComplication?: ComplicationSource;
  mode: DisplayMode;
}) {
  const simulatesWeather =
    selectedType === "weather" && hasWeatherSimulation(selectedVariant);

  return (
    <div
      className="watchface-footer__simulation"
      role="group"
      aria-label="Preview data"
    >
      {selectedType === "status" && (
        <label className="watchface-footer__field">
          <span>Preview status</span>
          <input
            maxLength={40}
            value={
              simulation.statusValues?.[selectedVariant as StatusSource] ??
              STATUS_SOURCES[selectedVariant as StatusSource].sample
            }
            onChange={(event) =>
              onSimulationChange({
                ...simulation,
                statusValues: {
                  ...simulation.statusValues,
                  [selectedVariant]: event.target.value.replace(
                    /[^\x20-\x7E]/g,
                    "",
                  ),
                },
              })
            }
          />
        </label>
      )}
      {selectedType === "complication" && selectedComplication && (
        <ComplicationSimulation
          source={selectedComplication}
          values={simulation}
          onChange={onSimulationChange}
          disabled={!ready}
        />
      )}
      {simulatesWeather && (
        <WeatherSimulation
          variant={selectedVariant}
          values={simulation}
          onChange={onSimulationChange}
          disabled={!ready}
        />
      )}
      {selectedType !== "status" &&
        selectedType !== "complication" &&
        !simulatesWeather && (
          <SimulationControl
            key={selectedType}
            type={selectedType}
            values={simulation}
            onChange={onSimulationChange}
            disabled={!ready}
            mode={mode}
          />
        )}
    </div>
  );
}

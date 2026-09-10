import { STATUS_SOURCES, type StatusSource } from "@/watchface/status-sources";
import type { Metric } from "@/watchface/layer-catalog";
import { ComplicationSimulation } from "./ComplicationSimulation";
import type { ComplicationSource } from "@/watchface/complications";
import { WeatherSimulation, hasWeatherSimulation } from "./WeatherSimulation";
import { supportsMode } from "@/watchface/capabilities";
import type { Device } from "@/devices/catalog";
import { SimulationControl } from "./SimulationControl";
import type { ElementType } from "@/watchface/schema";
import { Button } from "@/components/ui";
import { UndoIcon, RedoIcon } from "@/icons";
import type { useDesignHistory } from "./hooks/useDesignHistory";
import { type Simulation, type DisplayMode } from "./model/simulation";

export function EditorFooter({
  ready,
  device,
  history,
  simulation,
  onSimulationChange,
  selectedType,
  selectedVariant,
  selectedComplication,
  mode,
  onModeChange,
}: {
  ready: boolean;
  device: Device;
  history: ReturnType<typeof useDesignHistory>;
  simulation: Simulation;
  onSimulationChange: (values: Simulation) => void;
  selectedType: ElementType | Metric | "background";
  selectedVariant: string;
  selectedComplication?: ComplicationSource;
  mode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}) {
  return (
    <footer className="watchface-footer" aria-label="Editor controls">
      <div
        className="watchface-footer__section"
        role="group"
        aria-label="Edit history"
      >
        <Button
          size="sm"
          variant="ghost"
          disabled={!ready || !history.canUndo}
          onClick={history.undo}
        >
          <UndoIcon size="sm" />
          Undo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!ready || !history.canRedo}
          onClick={history.redo}
        >
          <RedoIcon size="sm" />
          Redo
        </Button>
      </div>
      <div className="watchface-footer__section watchface-footer__simulation">
        {selectedType === "status" && (
          <label className="ui-field u-font-xs">
            Preview status
            <input
              maxLength={40}
              value={
                simulation.statusValues?.[selectedVariant as StatusSource] ??
                STATUS_SOURCES[selectedVariant as StatusSource].sample
              }
              onChange={(e) =>
                onSimulationChange({
                  ...simulation,
                  statusValues: {
                    ...simulation.statusValues,
                    [selectedVariant]: e.target.value.replace(
                      /[^\x20-\x7E]/g,
                      "",
                    ),
                  },
                })
              }
            />
          </label>
        )}
        {selectedType === "complication" && selectedComplication ? (
          <ComplicationSimulation
            source={selectedComplication}
            values={simulation}
            onChange={onSimulationChange}
            disabled={!ready}
          />
        ) : null}
        {selectedType === "weather" && hasWeatherSimulation(selectedVariant) ? (
          <WeatherSimulation
            variant={selectedVariant}
            values={simulation}
            onChange={onSimulationChange}
            disabled={!ready}
          />
        ) : null}
        {selectedType !== "status" &&
          selectedType !== "complication" &&
          !(
            selectedType === "weather" && hasWeatherSimulation(selectedVariant)
          ) && (
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
      <div className="watchface-footer__section watchface-footer__modes">
        <label
          className="ui-checkbox-label u-font-xs u-text-secondary"
          title="Simulate Do Not Disturb when previewing Normal mode"
        >
          <input
            type="checkbox"
            checked={simulation.dnd ?? false}
            disabled={!ready}
            onChange={(event) =>
              onSimulationChange({ ...simulation, dnd: event.target.checked })
            }
          />{" "}
          DND
        </label>
        <div
          className="watchface-footer__segments"
          role="group"
          aria-label="Display mode"
        >
          {(
            [
              ["normal", "Normal"],
              ["always-on", "Always-on"],
              ["low-battery", "Low battery"],
              ["night", "Night"],
            ] as const
          )
            .filter(([key]) => supportsMode(device, key))
            .map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant="ghost"
                active={mode === key}
                aria-pressed={mode === key}
                disabled={!ready}
                onClick={() => onModeChange(key)}
              >
                {label}
              </Button>
            ))}
        </div>
      </div>
    </footer>
  );
}

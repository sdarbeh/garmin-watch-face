import type { Device } from "@/devices/catalog";
import type { ComplicationSource } from "@/watchface/complications";
import type { Metric } from "@/watchface/layer-catalog";
import type { ElementType } from "@/watchface/schema";
import { FooterDisplayControls } from "./footer/FooterDisplayControls";
import { FooterHistoryControls } from "./footer/FooterHistoryControls";
import { FooterSimulationControls } from "./footer/FooterSimulationControls";
import type { useDesignHistory } from "./hooks/useDesignHistory";
import type { DisplayMode, Simulation } from "./model/simulation";

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
      <FooterHistoryControls ready={ready} history={history} />
      <FooterSimulationControls
        ready={ready}
        simulation={simulation}
        onSimulationChange={onSimulationChange}
        selectedType={selectedType}
        selectedVariant={selectedVariant}
        selectedComplication={selectedComplication}
        mode={mode}
      />
      <FooterDisplayControls
        ready={ready}
        device={device}
        mode={mode}
        onModeChange={onModeChange}
      />
    </footer>
  );
}

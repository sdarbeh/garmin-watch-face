import type { Device } from "@/devices/catalog";
import type { ComplicationSource } from "@/watchface/complications";
import type { Metric } from "@/watchface/layer-catalog";
import type { ElementType } from "@/watchface/schema";
import type { useDesignHistory } from "@/components/editor/hooks/useDesignHistory";
import type {
  DisplayMode,
  Simulation,
} from "@/components/editor/model/simulation";
import { FooterDisplayControls } from "./FooterDisplayControls";
import { FooterHistoryControls } from "./FooterHistoryControls";
import { FooterSimulationControls } from "./FooterSimulationControls";

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
  preview,
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
  preview: boolean;
}) {
  return (
    <footer
      className="watchface-footer"
      aria-label="Editor controls"
      data-preview={preview}
    >
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

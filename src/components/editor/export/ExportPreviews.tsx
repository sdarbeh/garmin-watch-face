import type { Design } from "@/watchface/schema";
import {
  lowBatteryThreshold,
  powerLayout,
  type PowerMode,
} from "@/watchface/power";
import { SAMPLE_DATA } from "@/watchface/render-model";
import { WatchPreview } from "../canvas/WatchPreview";

const modes: { mode: PowerMode; label: string }[] = [
  { mode: "always-on", label: "Always-on" },
  { mode: "normal", label: "Normal" },
  { mode: "low-battery", label: "Low battery" },
];

export function ExportPreviews({ design }: { design: Design }) {
  return (
    <div
      className="watchface-export__previews"
      aria-label="Watch face display modes"
    >
      {modes.map(({ mode, label }) => (
        <figure
          key={mode}
          className="watchface-export__preview"
          data-primary={mode === "normal"}
        >
          <WatchPreview
            selected={null}
            design={powerLayout(design, mode)}
            samples={
              mode === "low-battery"
                ? {
                    ...SAMPLE_DATA,
                    battery: String(lowBatteryThreshold(design)),
                  }
                : SAMPLE_DATA
            }
          />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

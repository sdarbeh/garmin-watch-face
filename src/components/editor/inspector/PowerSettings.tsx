import { InspectorSection } from "./InspectorSection";
import { NightSettings } from "./NightSettings";
import { useState } from "react";
import { getDeviceById } from "@/devices/catalog";
import { lowBatteryThreshold } from "@/watchface/power";
import type { Design } from "@/watchface/schema";

export function PowerSettings({
  design,
  disabled,
  onChange,
}: {
  design: Design;
  disabled: boolean;
  onChange: (design: Design) => void;
}) {
  const device = getDeviceById(design.device)!;
  const [draft, setDraft] = useState<string | null>(null);
  if (!device.capabilities.alwaysOn && !device.capabilities.lowBattery)
    return null;
  return (
    <>
      <InspectorSection title="Power modes">
        {device.capabilities.alwaysOn && (
          <p className="u-font-xs u-text-secondary mb3">
            Edit always-on layers using the display-mode selector. The drawing
            area uses the full screen. Keep luminance below 10%; check the
            layout estimate and verify in Garmin’s simulator.
          </p>
        )}
        {device.capabilities.lowBattery && (
          <>
            <label className="ui-field u-grid gap2 u-font-xs mb2">
              Low battery threshold (%)
              <input
                type="number"
                min={device.power.minLowBatteryThreshold}
                max={device.power.maxLowBatteryThreshold}
                step={1}
                disabled={disabled}
                value={draft ?? lowBatteryThreshold(design)}
                onBlur={() => setDraft(null)}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft(value);
                  const threshold = Number(value);
                  if (
                    value !== "" &&
                    Number.isInteger(threshold) &&
                    threshold >= device.power.minLowBatteryThreshold &&
                    threshold <= device.power.maxLowBatteryThreshold
                  )
                    onChange({
                      ...design,
                      power: { lowBatteryThreshold: threshold },
                    });
                }}
              />
            </label>
            <p className="u-font-xs u-text-secondary">
              Switches to your low-battery layout at or below this level.
            </p>
          </>
        )}
      </InspectorSection>
      <NightSettings design={design} disabled={disabled} onChange={onChange} />
    </>
  );
}

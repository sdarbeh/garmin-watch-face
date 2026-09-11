import {
  COMPLICATIONS,
  supportsComplication,
  type ComplicationSource,
} from "@/watchface/complications";
import type { Device } from "@/devices/catalog";
import type { FaceElement } from "@/watchface/schema";
import { Switch } from "@/components/ui";
import { InspectorSection } from "./InspectorSection";
export function ComplicationContent({
  element,
  device,
  disabled,
  onChange,
}: {
  element: FaceElement;
  device: Device;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
}) {
  const settings = element.complication;
  if (!settings) return null;
  const update = (patch: Partial<typeof settings>) =>
    onChange({ complication: { ...settings, ...patch } });
  return (
    <InspectorSection title="Content" defaultOpen>
      <label className="watchface-property-row ui-field">
        Source
        <select
          value={settings.source}
          disabled={disabled}
          onChange={(event) =>
            update({ source: event.target.value as ComplicationSource })
          }
        >
          {Object.entries(COMPLICATIONS)
            .filter(([key]) => supportsComplication(device, key))
            .map(([key, source]) => (
              <option key={key} value={key}>
                {source.label}
              </option>
            ))}
        </select>
      </label>
      {COMPLICATIONS[settings.source].unit && (
        <Switch
          label="Show unit"
          disabled={disabled}
          checked={settings.showUnit}
          onCheckedChange={(showUnit) => update({ showUnit })}
        />
      )}
      {device.capabilities.complicationHold && (
        <Switch
          label="Hold to open"
          disabled={disabled}
          checked={settings.openOnHold}
          onCheckedChange={(openOnHold) => update({ openOnHold })}
        />
      )}
      <p className="u-font-xs u-text-secondary">
        Updates from Garmin on your watch. Missing readings show --. Hold to
        open launches the associated app when available.
      </p>
    </InspectorSection>
  );
}

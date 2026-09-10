import type { Design } from "@/watchface/schema";
import { InspectorSection } from "./InspectorSection";
export function OnWatchSettings({
  design,
  disabled,
  onChange,
}: {
  design: Design;
  disabled: boolean;
  onChange: (design: Design) => void;
}) {
  return (
    <InspectorSection title="On-watch customization">
      <label className="watchface-property-row u-font-xs mb2">
        Enable customization
        <input
          type="checkbox"
          disabled={disabled}
          checked={design.onWatch ?? false}
          onChange={(e) => onChange({ ...design, onWatch: e.target.checked })}
        />
      </label>
      <p className="u-font-xs u-text-secondary">
        Customize text complication sources and colors in Garmin’s watch-face
        settings after installation. Choose Custom colors to override the
        designed colors, or select your night layout. Rules keep their
        configured data sources.
      </p>
    </InspectorSection>
  );
}

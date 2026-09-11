import type { Design } from "@/watchface/schema";
import { Switch } from "@/components/ui";
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
      <Switch
        label="Enable customization"
        disabled={disabled}
        checked={design.onWatch ?? false}
        onCheckedChange={(onWatch) => onChange({ ...design, onWatch })}
      />
      <p className="u-font-xs u-text-secondary">
        Customize text complication sources and colors in Garmin’s watch-face
        settings after installation. Choose Custom colors to override the
        designed colors, or select your night layout. Rules keep their
        configured data sources.
      </p>
    </InspectorSection>
  );
}

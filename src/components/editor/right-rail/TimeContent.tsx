import { SegmentedControl, Switch } from "@/components/ui";
import { presentation, type FaceElement } from "@/watchface/schema";
import type { EditorLayerPatch } from "@/components/editor/model/commands";
import { InspectorSection } from "./InspectorSection";

type TimeStyle = "digital" | "hours" | "minutes" | "analog";

function timeStyle(variant: string): TimeStyle {
  switch (variant) {
    case "hours":
      return "hours";
    case "minutes":
      return "minutes";
    case "analog":
    case "analog-seconds":
      return "analog";
    default:
      return "digital";
  }
}

function timeVariant(style: TimeStyle, showSeconds: boolean) {
  if (style === "digital") return showSeconds ? "seconds" : "labeled";
  if (style === "analog") return showSeconds ? "analog-seconds" : "analog";
  return style;
}

export function TimeContent({
  element,
  disabled,
  onChange,
}: {
  element: FaceElement;
  disabled: boolean;
  onChange: (patch: EditorLayerPatch) => void;
}) {
  const currentPresentation = presentation(element);
  const style = timeStyle(currentPresentation.variant);
  const showSeconds = ["seconds", "analog-seconds"].includes(
    currentPresentation.variant,
  );
  const supportsSeconds = style === "digital" || style === "analog";
  const updateVariant = (nextStyle: TimeStyle, nextShowSeconds: boolean) =>
    onChange({
      presentation: {
        ...currentPresentation,
        variant: timeVariant(nextStyle, nextShowSeconds),
      },
    });

  return (
    <InspectorSection title="Content" defaultOpen>
      <div className="watchface-property-row">
        <span>Time format</span>
        <SegmentedControl
          label="Time format"
          options={[
            { value: "12", label: "12 hour" },
            { value: "24", label: "24 hour" },
          ]}
          value={element.timeFormat}
          disabled={disabled}
          onChange={(timeFormat) => onChange({ timeFormat })}
        />
      </div>
      <label className="watchface-property-row ui-field">
        Display
        <select
          disabled={disabled}
          value={style}
          onChange={(event) =>
            updateVariant(event.target.value as TimeStyle, showSeconds)
          }
        >
          <option value="digital">Digital</option>
          <option value="analog">Analog hands</option>
          <option value="hours">Hours only</option>
          <option value="minutes">Minutes only</option>
        </select>
      </label>
      {supportsSeconds && (
        <Switch
          label="Show seconds"
          checked={showSeconds}
          disabled={disabled}
          onCheckedChange={(checked) => updateVariant(style, checked)}
        />
      )}
    </InspectorSection>
  );
}

import { InspectorSection } from "./InspectorSection";
import { defaultFormat } from "@/watchface/formatting";
import { isGraphic, isMetric } from "@/watchface/layer-catalog";
import { presentation, type FaceElement } from "@/watchface/schema";
export function MetricFormatting({
  element,
  disabled,
  onChange,
}: {
  element: FaceElement;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
}) {
  const type = element.complication?.source ?? element.type;
  const variant = presentation(element).variant;
  if (
    !isMetric(type) ||
    isGraphic(element.type, variant) ||
    ["sunrise", "sunset"].includes(variant)
  )
    return null;
  const format = element.formatting ?? defaultFormat(type);
  const update = (patch: Partial<typeof format>) =>
    onChange({ formatting: { ...format, ...patch } });
  return (
    <InspectorSection title="Formatting">
      {[
        "distance",
        "weather",
        "runDistance",
        "bikeDistance",
        "altitude",
        "pressure",
      ].includes(type) &&
        variant !== "humidity" && (
          <label className="watchface-property-row ui-field u-font-xs mb2">
            Units
            <select
              disabled={disabled}
              value={format.units}
              onChange={(e) =>
                update({ units: e.target.value as typeof format.units })
              }
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
            </select>
          </label>
        )}
      <label className="watchface-property-row ui-field u-font-xs mb2">
        Decimals
        <select
          disabled={disabled}
          value={format.decimals}
          onChange={(e) => update({ decimals: Number(e.target.value) })}
        >
          {[0, 1, 2].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {(["prefix", "suffix"] as const).map((key) => (
        <label
          key={key}
          className="watchface-property-row ui-field u-font-xs mb2"
        >
          {key === "prefix" ? "Prefix" : "Suffix"}
          <input
            disabled={disabled}
            value={format[key]}
            maxLength={12}
            placeholder={key === "suffix" ? "Automatic" : "None"}
            onChange={(e) => {
              if (/^[\x20-\x7E]*$/.test(e.target.value))
                update({ [key]: e.target.value });
            }}
          />
        </label>
      ))}
    </InspectorSection>
  );
}

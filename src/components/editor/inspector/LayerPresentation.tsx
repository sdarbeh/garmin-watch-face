import {
  CHART_RANGES,
  CHART_SOURCES,
  type ChartSource,
} from "@/watchface/charts";
import { InspectorSection } from "./InspectorSection";
import {
  supportedMetrics,
  type CapabilityDevice,
} from "@/watchface/capabilities";
import { DimensionField } from "./DimensionField";
import { ImageField } from "./ImageField";
import { ColorField } from "@/components/ui";
import { presentation, type FaceElement } from "@/watchface/schema";
import {
  METRICS,
  layerVariants,
  isMetric,
  isGraphic,
} from "@/watchface/layer-catalog";
export function LayerPresentation({
  element,
  device,
  disabled,
  onChange,
}: {
  element: FaceElement;
  device: CapabilityDevice;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
}) {
  const p = presentation(element);
  const variants = layerVariants(element.type);
  const graphic = isGraphic(element.type, p.variant);
  const update = (patch: Partial<typeof p>) =>
    onChange({ presentation: { ...p, ...patch } });
  if (element.type === "text" || (element.type === "time" && !graphic))
    return null;
  return (
    <InspectorSection title="Appearance" defaultOpen>
      {variants.length > 1 && element.type !== "time" && (
        <label className="watchface-property-row ui-field u-font-xs mb2">
          Variant
          <select
            disabled={disabled}
            value={p.variant}
            onChange={(event) => update({ variant: event.target.value })}
          >
            {variants.map((variant) => (
              <option key={variant} value={variant}>
                {variant === "condition-icon"
                  ? "Weather icon"
                  : (
                      variant.charAt(0).toUpperCase() + variant.slice(1)
                    ).replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      )}
      {element.type === "chart" && (
        <>
          <label className="watchface-property-row ui-field u-font-xs mb2">
            History source
            <select
              disabled={disabled}
              value={element.chart?.source ?? "heartRate"}
              onChange={(e) =>
                onChange({
                  chart: {
                    ...element.chart!,
                    source: e.target.value as ChartSource,
                  },
                })
              }
            >
              {Object.entries(CHART_SOURCES)
                .filter(([key]) =>
                  device.capabilities.chartSources?.includes(key),
                )
                .map(([key, source]) => (
                  <option key={key} value={key}>
                    {source.label}
                    {source.unit ? ` (${source.unit})` : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="watchface-property-row ui-field u-font-xs mb2">
            Time range
            <select
              disabled={disabled}
              value={element.chart!.hours}
              onChange={(e) =>
                onChange({
                  chart: {
                    ...element.chart,
                    hours: Number(
                      e.target.value,
                    ) as (typeof CHART_RANGES)[number],
                  },
                })
              }
            >
              {CHART_RANGES.map((hours) => (
                <option key={hours} value={hours}>
                  {hours} {hours === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </label>
          <p className="u-font-xs u-text-secondary mb2">
            Oldest readings on the left, newest on the right. The scale adjusts
            to available readings; missing data leaves gaps. History
            availability depends on the watch.
          </p>
        </>
      )}
      {element.type === "progress" && (
        <label className="watchface-property-row ui-field u-font-xs mb2">
          Source
          <select
            disabled={disabled}
            value={p.source}
            onChange={(event) => {
              const source = event.target.value as keyof typeof METRICS;
              update({ source, goal: METRICS[source].goal });
            }}
          >
            {supportedMetrics(device).map((key) => (
              <option key={key} value={key}>
                {METRICS[key].label}
              </option>
            ))}
          </select>
        </label>
      )}
      {element.type === "image" && (
        <ImageField value={p.image} disabled={disabled} onChange={update} />
      )}
      {graphic && (
        <>
          {(
            [
              "width",
              "height",
              ...(element.type !== "image" ? ["stroke"] : []),
              ...(["ring", "bar"].includes(p.variant) &&
              element.type !== "chart"
                ? ["goal"]
                : []),
            ] as ("width" | "height" | "stroke" | "goal")[]
          ).map((key) => (
            <DimensionField
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={p[key]}
              disabled={disabled}
              min={key === "width" || key === "height" ? 8 : 1}
              max={{ stroke: 24, goal: 999999, width: 454, height: 454 }[key]}
              onChange={(value) => update({ [key]: value })}
            />
          ))}
          {element.type !== "image" && (
            <ColorField
              label="Color"
              value={element.color}
              disabled={disabled}
              onChange={(color) => onChange({ color })}
            />
          )}
        </>
      )}
      {p.variant === "condition-icon" && (
        <p className="u-font-xs u-text-secondary">
          Automatically shows sun, clouds, rain and other conditions using your
          watch’s latest weather data. Use Preview condition below to try each
          icon.
        </p>
      )}
      {p.variant !== "condition-icon" &&
        isMetric(element.type) &&
        !["steps", "battery"].includes(element.type) && (
          <p className="u-font-xs u-text-secondary">
            Watch data may be unavailable; missing readings display --. Editor
            values are samples.
          </p>
        )}
    </InspectorSection>
  );
}

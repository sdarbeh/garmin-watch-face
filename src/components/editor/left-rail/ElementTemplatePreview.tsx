import type { ElementTemplate } from "@/components/editor/model/element-templates";
import { LayerIcon } from "@/icons";

const SAMPLE_VALUES: Partial<Record<ElementTemplate["layerType"], string>> = {
  activeMinutes: "42m",
  battery: "82%",
  bodyBattery: "74",
  calories: "482",
  complication: "68",
  distance: "5.4",
  floors: "8",
  heartRate: "68",
  recovery: "18h",
  status: "PROD",
  steps: "6.2K",
  stress: "24",
  text: "Aa",
};

const WEATHER_VALUES: Record<string, string> = {
  humidity: "58%",
  sunrise: "6:42",
  sunset: "7:18",
  temperature: "72°",
  wind: "8 mph",
};

function AnalogPreview() {
  return (
    <svg className="u-icon-md" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" />
      <path d="M16 8v8l6 4" />
      <path d="M16 3v2M29 16h-2M16 29v-2M3 16h2" />
    </svg>
  );
}

function ProgressPreview() {
  return (
    <svg className="u-icon-md" viewBox="0 0 32 32" aria-hidden="true">
      <circle className="watchface-element-preview__track" cx="16" cy="16" r="11" />
      <path d="M16 5a11 11 0 1 1-9.5 16.5" />
    </svg>
  );
}

function ChartPreview() {
  return (
    <svg className="u-icon-md" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 25V15M12 25V9M19 25V18M26 25V5" />
    </svg>
  );
}

function ShapePreview() {
  return (
    <svg className="u-icon-md" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <rect x="14" y="14" width="12" height="12" rx="2" />
    </svg>
  );
}

function previewContent(template: ElementTemplate) {
  const variant = template.patch?.presentation?.variant;

  switch (template.layerType) {
    case "time":
      if (variant === "analog") return <AnalogPreview />;
      return (
        <span data-scale={template.id === "large-digital-time" ? "large" : "small"}>
          10:09
        </span>
      );
    case "date":
      return <span>SEP 11</span>;
    case "weather":
      if (variant && WEATHER_VALUES[variant]) {
        return <span>{WEATHER_VALUES[variant]}</span>;
      }
      return <LayerIcon type="weather" size="md" />;
    case "progress":
      return <ProgressPreview />;
    case "chart":
      return <ChartPreview />;
    case "shape":
      return <ShapePreview />;
    case "icon":
    case "image":
      return <LayerIcon type={template.layerType} size="md" />;
    default:
      return (
        <span>{SAMPLE_VALUES[template.layerType] ?? template.label.slice(0, 2)}</span>
      );
  }
}

export function ElementTemplatePreview({
  template,
}: {
  template: ElementTemplate;
}) {
  return (
    <span className="watchface-element-preview" aria-hidden="true">
      {previewContent(template)}
    </span>
  );
}

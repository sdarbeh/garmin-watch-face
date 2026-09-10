import { STATUS_SOURCES, type StatusSource } from "./status-sources";
import { SAMPLE_GOALS, type GoalSamples } from "./goals";
import { COMPLICATIONS, type ComplicationSamples } from "./complications";
import { type ChartPreview } from "./charts";
import { ruleAppearance } from "./rules";
import { defaultFormat, formattedValue } from "./formatting";
import { isAnalog, HAND_LENGTHS } from "./analog";
import { METRICS, isMetric, isGraphic } from "./layer-catalog";
import { presentation } from "./schema";
import { type Design, type FaceElement, type ElementType } from "./schema";
import { fontMetrics, fontKey, textWidth, TEXT_PLACEMENT } from "./fonts";
export const SAMPLE_DATA: Record<ElementType | keyof typeof METRICS, string> & {
  weatherCondition?: string;
  weatherHumidity?: string;
  weatherWind?: string;
  weatherFeelsLike?: string;
  chartPreview?: ChartPreview;
  goals?: GoalSamples;
  statusValues?: Partial<Record<StatusSource, string>>;
  complicationValues?: ComplicationSamples;
  dateFull?: string;
  weatherHigh?: string;
  weatherLow?: string;
  sunrise?: string;
  sunset?: string;
} = {
  ...(Object.fromEntries(
    Object.entries(METRICS).map(([key, value]) => [
      key,
      `${key === "distance" ? value.sample.toFixed(1) : value.sample}${value.unit}`,
    ]),
  ) as Record<keyof typeof METRICS, string>),
  goals: SAMPLE_GOALS,
  chart: "",
  complication: "",
  status: "",
  shape: "",
  icon: "",
  image: "",
  progress: "",
  text: "Your text",
  time: "13:09",
  date: "TUE 8 SEP",
  weatherCondition: "1",
  weatherHumidity: "64",
  weatherWind: "3.5",
  weatherFeelsLike: "21",
  dateFull: "TUE 8 SEP 2026",
  weatherHigh: "26",
  weatherLow: "18",
  sunrise: "06:24",
  sunset: "19:18",
  steps: "6248 steps",
  battery: "82% battery",
};
function sampleText(element: FaceElement, samples: typeof SAMPLE_DATA) {
  if (element.type === "status") {
    const source = presentation(element).variant as StatusSource;
    return samples.statusValues?.[source] ?? STATUS_SOURCES[source].sample;
  }
  if (element.complication) {
    const c = element.complication;
    const raw = samples.complicationValues?.[c.source];
    let value = parseFloat(samples[c.source]);
    if (Object.hasOwn(samples.complicationValues ?? {}, c.source))
      value = raw == null ? NaN : raw / COMPLICATIONS[c.source].divisor;
    const f = element.formatting ?? {
      ...defaultFormat(c.source),
      decimals: COMPLICATIONS[c.source].decimals,
    };
    return formattedValue(
      value,
      c.source,
      c.showUnit ? presentation(element).variant : "value",
      f,
    );
  }
  const variant = presentation(element).variant;
  if (element.type === "weather" && variant === "condition-icon")
    return samples.weatherCondition ?? "-1";
  if (
    isMetric(element.type) &&
    !["sunrise", "sunset", "ring", "bar"].includes(variant) &&
    (element.formatting || ["humidity", "wind", "feels-like"].includes(variant))
  ) {
    const key = {
      high: "weatherHigh",
      low: "weatherLow",
      humidity: "weatherHumidity",
      wind: "weatherWind",
      "feels-like": "weatherFeelsLike",
    }[variant] as
      | "weatherHigh"
      | "weatherLow"
      | "weatherHumidity"
      | "weatherWind"
      | "weatherFeelsLike"
      | undefined;
    const value = parseFloat(
      key ? (samples[key] ?? "--") : samples[element.type],
    );
    return formattedValue(
      value,
      element.type,
      variant,
      element.formatting ?? defaultFormat(element.type),
    );
  }
  if (element.type === "date" && presentation(element).variant === "day")
    return samples.date.split(" ")[1];
  if (element.type === "date" && presentation(element).variant === "full")
    return samples.dateFull ?? samples.date;
  if (element.type === "weather") {
    const variant = presentation(element).variant;
    if (variant === "temperature") return `${samples.weather.split(" ")[0]} C`;
    if (variant === "high") return `H ${samples.weatherHigh ?? "--"}`;
    if (variant === "low") return `L ${samples.weatherLow ?? "--"}`;
    if (variant === "sunrise" || variant === "sunset")
      return samples[variant] ?? "--";
  }
  if (element.type === "text") return element.text;
  if (element.type === "time") {
    const [hour, minute, second = "00"] = samples.time.split(":");
    const hours =
      element.timeFormat === "12"
        ? (Number(hour) % 12 || 12).toString().padStart(2, "0")
        : hour;
    if (presentation(element).variant === "hours") return hours;
    if (presentation(element).variant === "minutes") return minute;
    return `${hours}:${minute}${["seconds", "analog-seconds"].includes(presentation(element).variant) ? `:${second}` : ""}`;
  }
  const value = samples[element.type];
  if (
    element.type === "battery" &&
    presentation(element).variant === "percentage"
  )
    return `${value.split(" ")[0].replace("%", "")}%`;
  return isMetric(element.type) && presentation(element).variant === "value"
    ? value.split(" ")[0].replace("%", "")
    : value;
}
export function renderModel(
  design: Design,
  samples = SAMPLE_DATA,
  evaluateRules = true,
) {
  return design.elements
    .map((element) =>
      evaluateRules && element.visible
        ? {
            ...element,
            ...ruleAppearance(element.rules ?? [], samples, element.color),
          }
        : element,
    )
    .filter((element) => element.visible)
    .map((element) => ({
      ...element,
      font: {
        ...fontMetrics(element),
        key: fontKey(element),
        atlasKey: fontKey(element).replace("garmin_", "roboto_"),
        pixels: element.size,
      },
      sample: sampleText(element, samples),
      chartPreview: samples.chartPreview ?? "typical",
      ratio: Math.max(
        0,
        Math.min(
          1,
          (parseFloat(
            samples[
              element.type === "progress"
                ? presentation(element).source
                : (element.complication?.source ?? element.type)
            ],
          ) || 0) / presentation(element).goal,
        ),
      ),
    }));
}
export function layoutWarnings(design: Design): string[] {
  return renderModel(design).flatMap((e) => {
    if (isAnalog(presentation(e).variant)) {
      const p = presentation(e);
      const radius =
        Math.max(p.width, p.height) * HAND_LENGTHS[2] + p.stroke / 2;
      return Math.hypot(e.x - 227, e.y - 227) + radius > 224
        ? [`${e.id}: hands may clip at the round screen edge.`]
        : [];
    }
    const graphic = isGraphic(e.type, presentation(e).variant);
    const width = graphic ? presentation(e).width : textWidth(e.sample, e.font);
    const halfWidth = width / 2;
    const halfHeight = (graphic ? presentation(e).height : e.font.height) / 2;
    const centerX =
      e.x + (graphic ? 0 : width * TEXT_PLACEMENT[e.alignment].centerOffset);
    const outside =
      Math.hypot(
        Math.abs(centerX - 227) + halfWidth,
        Math.abs(e.y - 227) + halfHeight,
      ) > 224;
    return outside
      ? [
          `${e.id}: text may clip at the round screen edge. Check the simulator; live values can be wider.`,
        ]
      : [];
  });
}

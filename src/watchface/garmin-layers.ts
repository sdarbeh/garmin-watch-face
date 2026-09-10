import { COMPLICATIONS, isComplicationSource } from "./complications";
import { GOAL_SOURCES, hasUserGoal } from "./goals";
import {
  conversion,
  weatherValue,
  defaultFormat,
  metricUnit,
} from "./formatting";
import { WEATHER_CONDITIONS } from "./weather";
import { METRIC_SOURCES } from "./data-sources";
import { dialMarks } from "./dial";
import { HAND_LENGTHS, isAnalog } from "./analog";
import { METRICS, isGraphic, isMetric } from "./layer-catalog";
import { graphicLines } from "./graphics";
import { presentation, type Design } from "./schema";
import { compilationLayouts } from "./power";
import type { renderModel } from "./render-model";
export function usedImages(design: Design) {
  const images = new Map<
    string,
    {
      key: string;
      image: string;
      width: number;
      height: number;
      pixelated: boolean;
    }
  >();
  for (const layout of compilationLayouts(design))
    for (const e of layout.elements) {
      const p = presentation(e);
      if (e.type !== "image" || !e.visible || !p.image) continue;
      const signature = `${p.variant}:${p.width}:${p.height}:${p.image}`;
      if (!images.has(signature))
        images.set(signature, {
          key: `image_${images.size}`,
          image: p.image,
          width: p.width,
          height: p.height,
          pixelated: p.variant === "pixel",
        });
    }
  return [...images.values()];
}
export function drawGraphic(
  e: ReturnType<typeof renderModel>[number],
  shift: string,
  images: ReturnType<typeof usedImages>,
) {
  const p = presentation(e);
  if (!isGraphic(e.type, p.variant)) return null;
  const prefix = `dc.setColor(0x${e.color.slice(1)}, Graphics.COLOR_TRANSPARENT); dc.setPenWidth(${p.stroke});`;
  if (e.type === "chart")
    return `${prefix} drawHistory(dc, ${e.x}, ${e.y}${shift}, ${p.width}, ${p.height}, ${e.chart!.hours}, ${p.variant === "bar"}, ${JSON.stringify(e.chart?.source ?? "heartRate")}); dc.setPenWidth(1);`;
  if (e.type === "shape" && ["dial", "field-dial"].includes(p.variant))
    return (
      dialMarks(e)
        .map(
          (mark) =>
            `dc.setColor(0x${mark.color.slice(1)}, Graphics.COLOR_TRANSPARENT); ` +
            (mark.kind === "disc"
              ? `dc.fillCircle(${mark.x}, ${mark.y}${shift}, ${mark.radius});`
              : `dc.setPenWidth(${mark.stroke}); dc.drawLine(${mark.x}, ${mark.y}${shift}, ${mark.x2}, ${mark.y2}${shift});`),
        )
        .join("\n") + "dc.setPenWidth(1);"
    );
  if (p.variant === "condition-icon") {
    const drawCondition = (code: number) =>
      graphicLines({ ...e, sample: String(code) })
        .flatMap((line) =>
          line
            .slice(1)
            .map(
              ([x, y], i) =>
                `dc.drawLine(${line[i][0]}, ${line[i][1]}${shift}, ${x}, ${y}${shift});`,
            ),
        )
        .join("\n");
    return (
      prefix +
      WEATHER_CONDITIONS.map(
        (condition, index) =>
          `${index ? "else " : ""}if (conditions != null && (${condition.codes.map((code) => `conditions.condition == ${code}`).join(" || ")})) { ${drawCondition(condition.codes[0])} }`,
      ).join("\n") +
      ` else { ${drawCondition(-1)} } dc.setPenWidth(1);`
    );
  }
  if (isAnalog(p.variant)) {
    const turns = [
      "(clock.hour % 12 + clock.min / 60.0) / 12.0",
      "clock.min / 60.0",
    ];
    if (p.variant === "analog-seconds" && !shift)
      turns.push("clock.sec / 60.0");
    return (
      prefix +
      turns
        .map((turn, index) => {
          const angle = `(${turn}) * Math.PI * 2`;
          return `dc.drawLine(${e.x}, ${e.y}${shift}, (${e.x} + Math.sin(${angle}) * ${p.width * HAND_LENGTHS[index]}).toNumber(), (${e.y}${shift} - Math.cos(${angle}) * ${p.height * HAND_LENGTHS[index]}).toNumber());`;
        })
        .join("\n") +
      "dc.setPenWidth(1);"
    );
  }
  if (e.type === "image" && p.image) {
    const image = images.find(
      (image) =>
        image.image === p.image &&
        image.pixelated === (p.variant === "pixel") &&
        image.width === p.width &&
        image.height === p.height,
    )!;
    return `dc.drawBitmap(${e.x - p.width / 2}, ${e.y - p.height / 2}${shift}, bitmap_${image.key});`;
  }
  if (p.variant === "ring" || p.variant === "bar") {
    const metric =
      e.type === "progress" ? p.source : (e.complication?.source ?? e.type);
    return `${prefix}\n        drawProgress(dc, ${e.x}, ${e.y}${shift}, ${p.width}, ${p.height}, ${metric}, ${p.goal}, ${p.variant === "ring"});`;
  }
  return (
    prefix +
    graphicLines(e)
      .flatMap((line) =>
        line
          .slice(1)
          .map(
            ([x, y], i) =>
              `dc.drawLine(${line[i][0]}, ${line[i][1]}${shift}, ${x}, ${y}${shift});`,
          ),
      )
      .join("\n        ") +
    "dc.setPenWidth(1);"
  );
}
export function metricText(
  type: string,
  variant: string,
  format?: import("./formatting").ValueFormat,
) {
  if (!isMetric(type)) return null;
  if (
    format ||
    (type === "weather" && ["humidity", "wind", "feels-like"].includes(variant))
  ) {
    if (!["sunrise", "sunset"].includes(variant)) {
      const f = format ?? defaultFormat(type);
      const field = weatherValue(variant)?.field ?? "temperature";
      const source =
        type === "weather"
          ? `(conditions == null ? null : conditions.${field})`
          : type;
      const c = conversion(type, variant, f.units === "imperial");
      const suffix = f.suffix || metricUnit(type, variant, c.unit);
      return `formatValue(${source}, ${c.scale}, ${c.offset}, ${JSON.stringify("%." + f.decimals + "f")}, ${JSON.stringify(f.prefix)}, ${JSON.stringify(suffix)})`;
    }
  }
  if (type === "weather") {
    if (variant === "temperature") return 'formatMetric(weather, false) + " C"';
    if (variant === "high")
      return '\"H \" + formatMetric(conditions == null ? null : conditions.highTemperature, false)';
    if (variant === "low")
      return '\"L \" + formatMetric(conditions == null ? null : conditions.lowTemperature, false)';
    if (variant === "sunrise" || variant === "sunset")
      return `solarTime(conditions, ${variant === "sunrise"})`;
  }
  if (type === "battery" && variant === "percentage")
    return 'formatMetric(battery, false) + "%"';
  if ((type === "steps" || type === "battery") && variant === "labeled")
    return `${type}Text`;
  return `formatMetric(${type}, ${type === "distance"})${variant === "value" ? "" : ` + ${JSON.stringify(METRICS[type].unit)}`}`;
}
export function requiredMetrics(design: Design) {
  return new Set(
    compilationLayouts(design)
      .flatMap((layout) =>
        layout.elements
          .filter((e) => e.visible)
          .flatMap((e) => [
            e.type === "progress"
              ? presentation(e).source
              : (e.complication?.source ?? e.type),
            ...(e.type === "chart" ? ["heartRate"] : []),
            ...(e.rules ?? []).map((r) => r.source),
          ]),
      )
      .filter(isMetric),
  );
}
export function metricSource(design: Design) {
  const required = requiredMetrics(design);

  const goals = [
    ...new Set(
      compilationLayouts(design).flatMap((layout) =>
        layout.elements
          .filter((e) => e.visible)
          .flatMap((e) =>
            (e.rules ?? [])
              .filter((r) => r.target === "goal")
              .map((r) => r.source),
          ),
      ),
    ),
  ].filter(hasUserGoal);
  const goalBindings = goals
    .map(
      (source) =>
        `        var ${source}Goal = info has :${GOAL_SOURCES[source].field} ? info.${GOAL_SOURCES[source].field} : null;`,
    )
    .join("\n");
  return (
    goalBindings +
    "\n" +
    [...required]
      .filter(
        (type) =>
          METRIC_SOURCES[type] ||
          (isComplicationSource(type) && !["steps", "battery"].includes(type)),
      )
      .map(
        (type) =>
          "        " +
          (METRIC_SOURCES[type] ??
            (isComplicationSource(type)
              ? `var ${type} = readComplication(Complications.COMPLICATION_TYPE_${COMPLICATIONS[type].constant}, ${COMPLICATIONS[type].divisor}.0);`
              : "")),
      )
      .join("\n")
  );
}
export const graphicMethods = `
    function formatValue(value, scale, offset, pattern, prefix, suffix) {
        if (value == null) { return "--"; }
        return prefix + (value.toFloat() * scale + offset).format(pattern) + suffix;
    }

    function solarTime(conditions, rise) {
        if (conditions == null || conditions.observationLocationPosition == null) { return "--"; }
        var moment = rise ? Weather.getSunrise(conditions.observationLocationPosition, Time.now()) : Weather.getSunset(conditions.observationLocationPosition, Time.now());
        if (moment == null) { return "--"; }
        var local = Gregorian.info(moment, Time.FORMAT_SHORT);
        return local.hour.format("%02d") + ":" + local.min.format("%02d");
    }
    function formatMetric(value, decimal) { return value == null ? "--" : value.format(decimal ? "%.1f" : "%.0f"); }
    function drawProgress(dc, x, y, width, height, value, goal, ring) {
        if (value == null || value <= 0) { dc.setPenWidth(1); return; }
        var ratio = value.toFloat() / goal;
        if (ratio > 1) { ratio = 1.0; }
        if (!ring) { dc.drawLine(x-width/2, y, x-width/2+width*ratio, y); }
        else {
            var previousX = x;
            var previousY = y-height*0.45;
            for (var i = 1; i <= 64; i++) {
                var angle = -Math.PI/2 + Math.PI*2*ratio*i/64;
                var nextX = x+Math.cos(angle)*width*0.45;
                var nextY = y+Math.sin(angle)*height*0.45;
                dc.drawLine(previousX, previousY, nextX, nextY);
                previousX = nextX; previousY = nextY;
            }
        }
        dc.setPenWidth(1);
    }
`;

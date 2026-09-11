import { getDeviceById } from "../devices/catalog";
import { defaultMetricRules } from "./default-rules";
import {
  supportsComplication,
  isComplicationSource,
  type ComplicationSettings,
} from "./complications";
import { CHART_RANGES, CHART_SOURCES, type ChartSettings } from "./charts";
import { validateRules, canRecolor, type AppearanceRule } from "./rules";
import { type ValueFormat } from "./formatting";
import {
  ELEMENTS,
  supportsLayer,
  supportsMetric,
  supportsMode,
  type ElementType,
} from "./capabilities";
import {
  MAX_IMAGE_DATA_LENGTH,
  MAX_TOTAL_IMAGE_DATA_LENGTH,
} from "./image-limits";
import { METRICS, layerVariants, isMetric, type Metric } from "./layer-catalog";
import { devices } from "../devices/catalog";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  type FontFamily,
  type FontWeight,
  type FontSize,
  type Alignment,
} from "./fonts";
export type { FontSize } from "./fonts";
/** Current data-only project format. No legacy readers. */
export const DEVICE = devices[0];
export { ELEMENTS, type ElementType } from "./capabilities";
export type ElementId = string;
export const MAX_ELEMENTS = 16;
export const COLORS = [
  "#000000",
  "#FFFFFF",
  "#CCCCCC",
  "#AAAAAA",
  "#FFAA00",
  "#00AAAA",
] as const;
export type FaceColor = string;
export interface FaceElement {
  id: ElementId;
  name?: string;
  type: ElementType;
  visible: boolean;
  locked: boolean;
  text: string;
  x: number;
  y: number;
  color: FaceColor;
  size: FontSize;
  family: FontFamily;
  weight: FontWeight;
  alignment: Alignment;
  opacity: 100;
  timeFormat: "12" | "24";
  formatting?: ValueFormat;
  rules?: AppearanceRule[];
  chart?: ChartSettings;
  complication?: ComplicationSettings;
  openOnHold?: boolean;
  presentation?: {
    variant: string;
    width: number;
    height: number;
    stroke: number;
    goal: number;
    source: Metric;
    image: string;
  };
}
export type FaceLayout = Pick<Design, "background" | "elements">;
export interface Design {
  format: "watchface-project";
  version: 1;
  device: string;
  name: string;
  background: FaceColor;
  elements: FaceElement[];
  onWatch?: boolean;
  power?: { lowBatteryThreshold: number };
  night?: {
    enabled: boolean;
    trigger: "dnd" | "schedule";
    start: number;
    end: number;
  };
  layouts?: Partial<Record<"always-on" | "low-battery" | "night", FaceLayout>>;
}
export const MAX_PROJECT_BYTES = 1572864;
/** Apply only at creation; saved designs retain the user's explicit choices. */
export function defaultFeatures(
  deviceId: string,
): Pick<Design, "onWatch" | "night"> {
  const capabilities = getDeviceById(deviceId)!.capabilities;
  return {
    ...(capabilities.onWatchSettings ? { onWatch: true } : {}),
    ...(capabilities.nightLayout
      ? {
          night: {
            enabled: true,
            trigger: capabilities.doNotDisturb
              ? ("dnd" as const)
              : ("schedule" as const),
            start: 1320,
            end: 420,
          },
        }
      : {}),
  };
}
export function defaultDesign(deviceId = "fr970"): Design {
  return {
    format: "watchface-project",
    version: 1,
    device: deviceId,
    name: "My watch face",
    ...defaultFeatures(deviceId),
    background: "#000000",
    // Draw back-to-front; the layer panel presents this list in reverse.
    elements: [
      {
        ...createElement("battery", "battery"),
        rules: defaultMetricRules("battery"),
        y: 340,
        color: "#AAAAAA",
      },
      {
        ...createElement("steps", "steps"),
        rules: defaultMetricRules("steps"),
        y: 288,
        color: "#CCCCCC",
      },
      { ...createElement("time", "time"), y: 197, size: 120 },
      { ...createElement("date", "date"), y: 115, color: "#FFAA00" },
    ],
  };
}
export function createElement(
  type: ElementType | Metric,
  id: string,
): FaceElement {
  if (
    !(ELEMENTS as readonly string[]).includes(type) &&
    isComplicationSource(type)
  )
    return {
      ...createElement("complication", id),
      complication: { source: type, showUnit: true, openOnHold: false },
    };
  const elementType = type as ElementType;
  return {
    id,
    ...(type === "chart" ? { chart: { hours: 4 as const } } : {}),
    ...(type === "complication"
      ? {
          complication: {
            source: "heartRate" as const,
            showUnit: true,
            openOnHold: false,
          },
        }
      : {}),
    type: elementType,
    visible: true,
    locked: false,
    text: type === "text" ? "Your text" : "",
    x: 227,
    y: 227,
    color: "#FFFFFF",
    size: 40,
    family: "garmin",
    weight: 400,
    alignment: "center",
    opacity: 100,
    timeFormat: "12",
  };
}
function object(
  value: unknown,
  keys: string[],
  path: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  const v = value as Record<string, unknown>;
  if (Object.keys(v).sort().join(",") !== [...keys].sort().join(","))
    throw new Error(`${path} contains missing or unsupported properties.`);
  return v;
}
function color(value: unknown): FaceColor {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value))
    throw new Error("Use a six-digit hex color, such as #3478F6.");
  return value.toUpperCase();
}
export function validateDesign(input: unknown): Design {
  const v = object(
    input,
    [
      "format",
      "version",
      "device",
      "name",
      "background",
      "elements",
      ...(input && typeof input === "object" && "onWatch" in input
        ? ["onWatch"]
        : []),
      ...(input && typeof input === "object" && "night" in input
        ? ["night"]
        : []),
      ...(input && typeof input === "object" && "layouts" in input
        ? ["layouts"]
        : []),
      ...(input && typeof input === "object" && "power" in input
        ? ["power"]
        : []),
    ],
    "Project",
  );
  if (v.format !== "watchface-project" || v.version !== 1)
    throw new Error(
      "Unsupported project format or version. This app requires a current watchface project.",
    );
  const device =
    typeof v.device === "string" ? getDeviceById(v.device) : undefined;
  if (!device?.supported) throw new Error("Choose a supported watch.");
  if (
    typeof v.name !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9 _-]{0,39}$/.test(v.name)
  )
    throw new Error(
      "Project name must be 1–40 letters, numbers, spaces, dashes or underscores, beginning with a letter or number.",
    );
  if (!Array.isArray(v.elements) || v.elements.length > MAX_ELEMENTS)
    throw new Error(`Use up to ${MAX_ELEMENTS} elements.`);
  const ids = new Set<string>();
  const elements: FaceElement[] = [];
  for (const field of v.elements) {
    const e = object(
      field,
      [
        "id",
        "type",
        "visible",
        "locked",
        "text",
        "x",
        "y",
        "color",
        "size",
        "family",
        "weight",
        "alignment",
        "opacity",
        "timeFormat",
        ...(field && typeof field === "object" && "name" in field
          ? ["name"]
          : []),
        ...(field && typeof field === "object" && "openOnHold" in field
          ? ["openOnHold"]
          : []),
        ...(field && typeof field === "object" && "complication" in field
          ? ["complication"]
          : []),
        ...(field && typeof field === "object" && "chart" in field
          ? ["chart"]
          : []),
        ...(field && typeof field === "object" && "rules" in field
          ? ["rules"]
          : []),
        ...(field && typeof field === "object" && "formatting" in field
          ? ["formatting"]
          : []),
        ...(field && typeof field === "object" && "presentation" in field
          ? ["presentation"]
          : []),
      ],
      "Element",
    );
    if (
      typeof e.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,48}$/.test(e.id) ||
      e.id === "background" ||
      ids.has(e.id)
    )
      throw new Error("Element IDs must be unique and valid.");
    const id = e.id;
    ids.add(id);
    if (
      e.name !== undefined &&
      (typeof e.name !== "string" || !/^[\x20-\x7E]{0,40}$/.test(e.name))
    )
      throw new Error("Layer names support up to 40 printable characters.");
    if (
      !ELEMENTS.includes(e.type as ElementType) ||
      !supportsLayer(device, e.type as string)
    )
      throw new Error("Unsupported element type.");
    if (typeof e.visible !== "boolean" || typeof e.locked !== "boolean")
      throw new Error("Invalid visibility or lock state.");
    if (
      typeof e.text !== "string" ||
      !/^[\x20-\x7E]{0,40}$/.test(e.text) ||
      (e.type !== "text" && e.text !== "")
    )
      throw new Error(
        "Static text supports up to 40 printable ASCII characters.",
      );
    if (e.opacity !== 100)
      throw new Error("Text opacity is not yet supported. Use 100%.");
    if (e.timeFormat !== "12" && e.timeFormat !== "24")
      throw new Error("Choose a 12 or 24 hour time format.");
    if (!FONT_SIZES.includes(e.size as FontSize))
      throw new Error(`${id}: unsupported font size.`);
    if (typeof e.family !== "string" || !Object.hasOwn(FONT_FAMILIES, e.family))
      throw new Error("Choose a supported font family.");
    const family = e.family as FontFamily;
    if (
      !(FONT_FAMILIES[family].weights as readonly number[]).includes(
        e.weight as number,
      )
    )
      throw new Error("Unsupported font weight for this family.");
    if (!["left", "center", "right"].includes(e.alignment as string))
      throw new Error("Unsupported text alignment.");
    for (const axis of ["x", "y"] as const) {
      if (
        typeof e[axis] !== "number" ||
        !Number.isInteger(e[axis]) ||
        e[axis] < 50 ||
        e[axis] > 404
      )
        throw new Error(
          `${id}: ${axis} must be a whole number from 50 to 404.`,
        );
    }
    let presentation: FaceElement["presentation"];
    if (e.presentation !== undefined) {
      const p = object(
        e.presentation,
        ["variant", "width", "height", "stroke", "goal", "source", "image"],
        "Presentation",
      );
      const variants = layerVariants(e.type as string);
      if (!variants.includes(p.variant as never))
        throw new Error("Unsupported layer variant.");
      for (const [key, min, max] of [
        ["width", 8, 454],
        ["height", 8, 454],
        ["stroke", 1, 24],
        ["goal", 1, 999999],
      ] as const) {
        if (
          typeof p[key] !== "number" ||
          !Number.isInteger(p[key]) ||
          p[key] < min ||
          p[key] > max
        )
          throw new Error(`Invalid ${key}. Use ${min}–${max}.`);
      }
      if (
        !isMetric(p.source as string) ||
        (e.type === "progress" && !supportsMetric(device, p.source as string))
      )
        throw new Error("Unsupported data source.");
      if (typeof p.image !== "string" || (e.type !== "image" && p.image !== ""))
        throw new Error("Invalid image.");
      if (p.image) validateImage(p.image);
      presentation = p as FaceElement["presentation"];
    }
    let formatting: ValueFormat | undefined;
    if (e.formatting !== undefined) {
      const f = object(
        e.formatting,
        ["units", "decimals", "prefix", "suffix"],
        "Formatting",
      );
      if (
        (!isMetric(e.type as string) && e.type !== "complication") ||
        !["metric", "imperial"].includes(f.units as string) ||
        !Number.isInteger(f.decimals) ||
        Number(f.decimals) < 0 ||
        Number(f.decimals) > 2 ||
        typeof f.prefix !== "string" ||
        typeof f.suffix !== "string" ||
        !/^[\x20-\x7E]{0,12}$/.test(f.prefix) ||
        !/^[\x20-\x7E]{0,12}$/.test(f.suffix)
      )
        throw new Error("Invalid metric formatting.");
      formatting = f as unknown as ValueFormat;
    }
    const rules =
      e.rules === undefined
        ? undefined
        : validateRules(
            e.rules,
            device,
            canRecolor(e.type as string, presentation?.variant),
          );
    let chart: ChartSettings | undefined;
    if (e.type === "chart") {
      const c = object(
        e.chart,
        [
          "hours",
          ...(e.chart && typeof e.chart === "object" && "source" in e.chart
            ? ["source"]
            : []),
        ],
        "Chart",
      );
      if (
        c.source !== undefined &&
        (typeof c.source !== "string" ||
          !Object.hasOwn(CHART_SOURCES, c.source) ||
          !(device.capabilities.chartSources as readonly string[]).includes(
            c.source,
          ))
      )
        throw new Error("Unsupported chart source.");
      if (!(CHART_RANGES as readonly unknown[]).includes(c.hours))
        throw new Error("Unsupported chart range.");
      chart = {
        hours: c.hours as ChartSettings["hours"],
        ...(c.source ? { source: c.source as ChartSettings["source"] } : {}),
      };
    } else if (e.chart !== undefined)
      throw new Error("Chart settings require a chart layer.");
    if (
      e.openOnHold !== undefined &&
      (typeof e.openOnHold !== "boolean" ||
        !isComplicationSource(e.type as string) ||
        !device.capabilities.complicationHold)
    )
      throw new Error("Unsupported hold interaction.");
    let complication: ComplicationSettings | undefined;
    if (e.type === "complication") {
      const c = object(
        e.complication,
        ["source", "showUnit", "openOnHold"],
        "Complication",
      );
      if (
        typeof c.source !== "string" ||
        !supportsComplication(device, c.source) ||
        typeof c.showUnit !== "boolean" ||
        typeof c.openOnHold !== "boolean" ||
        (c.openOnHold && !device.capabilities.complicationHold)
      )
        throw new Error("Unsupported complication source or interaction.");
      complication = {
        source: c.source,
        showUnit: c.showUnit,
        openOnHold: c.openOnHold,
      };
    } else if (e.complication !== undefined)
      throw new Error("Complication settings require a complication layer.");
    elements.push({
      ...(e.name !== undefined ? { name: e.name } : {}),
      ...(e.openOnHold !== undefined
        ? { openOnHold: e.openOnHold as boolean }
        : {}),
      ...(complication ? { complication } : {}),
      ...(chart ? { chart } : {}),
      ...(rules ? { rules } : {}),
      ...(formatting ? { formatting } : {}),
      ...(presentation ? { presentation } : {}),
      id,
      type: e.type as ElementType,
      visible: e.visible,
      locked: e.locked,
      text: e.text,
      x: e.x as number,
      y: e.y as number,
      color: color(e.color),
      size: e.size as FontSize,
      family,
      weight: e.weight as FontWeight,
      alignment: e.alignment as Alignment,
      opacity: e.opacity,
      timeFormat: e.timeFormat,
    });
  }
  if (
    v.onWatch !== undefined &&
    (typeof v.onWatch !== "boolean" ||
      (v.onWatch && !device.capabilities.onWatchSettings))
  )
    throw new Error("Unsupported on-watch settings.");
  let power: Design["power"];
  if (v.power !== undefined) {
    const settings = object(v.power, ["lowBatteryThreshold"], "Power settings");
    const threshold = settings.lowBatteryThreshold;
    if (
      !device.capabilities.lowBattery ||
      typeof threshold !== "number" ||
      !Number.isInteger(threshold) ||
      threshold < device.power.minLowBatteryThreshold ||
      threshold > device.power.maxLowBatteryThreshold
    )
      throw new Error(
        "Low battery threshold must be between 1 and 30 percent.",
      );
    power = { lowBatteryThreshold: threshold };
  }
  let night: Design["night"];
  if (v.night !== undefined) {
    const n = object(
      v.night,
      ["enabled", "trigger", "start", "end"],
      "Night settings",
    );
    if (
      !device.capabilities.nightLayout ||
      typeof n.enabled !== "boolean" ||
      (n.trigger !== "dnd" && n.trigger !== "schedule") ||
      (n.trigger === "dnd" && !device.capabilities.doNotDisturb) ||
      typeof n.start !== "number" ||
      !Number.isInteger(n.start) ||
      n.start < 0 ||
      n.start >= 1440 ||
      typeof n.end !== "number" ||
      !Number.isInteger(n.end) ||
      n.end < 0 ||
      n.end >= 1440 ||
      n.start === n.end
    )
      throw new Error(
        "Choose a valid night trigger and different start/end times.",
      );
    night = {
      enabled: n.enabled,
      trigger: n.trigger,
      start: n.start,
      end: n.end,
    };
  }
  let layouts: Design["layouts"];
  if (v.layouts !== undefined) {
    if (!v.layouts || typeof v.layouts !== "object" || Array.isArray(v.layouts))
      throw new Error("Layouts must be an object.");
    layouts = {};
    for (const [mode, raw] of Object.entries(v.layouts)) {
      if (mode !== "always-on" && mode !== "low-battery" && mode !== "night")
        throw new Error("Unsupported layout mode.");
      if (!supportsMode(device, mode))
        throw new Error("Device does not support this layout.");
      const layout = object(raw, ["background", "elements"], "Layout");
      const checked = validateDesign({
        format: v.format,
        version: v.version,
        device: v.device,
        name: v.name,
        ...layout,
      });
      if (mode === "always-on" && checked.background !== "#000000")
        throw new Error("Always-on requires a black background.");
      layouts[mode] = {
        background: checked.background,
        elements: checked.elements,
      };
    }
  }
  const imageBytes = [
    ...elements,
    ...Object.values(layouts ?? {}).flatMap((layout) => layout.elements),
  ].reduce((total, e) => total + (e.presentation?.image.length ?? 0), 0);
  if (imageBytes > MAX_TOTAL_IMAGE_DATA_LENGTH)
    throw new Error(
      "Combined images exceed the 1 MB encoded project budget. Use smaller images or fewer copies.",
    );
  return {
    ...(v.onWatch !== undefined ? { onWatch: v.onWatch as boolean } : {}),
    format: "watchface-project",
    version: 1,
    device: device.id,
    name: v.name,
    background: color(v.background),
    ...(power ? { power } : {}),
    ...(night ? { night } : {}),
    ...(layouts ? { layouts } : {}),
    elements,
  };
}
export function parseProject(text: string): Design {
  if (new TextEncoder().encode(text).length > MAX_PROJECT_BYTES)
    throw new Error("Project exceeds the 1.5 MB limit.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "This is not a valid JSON project. Installable .prg files cannot be edited.",
    );
  }
  return validateDesign(data);
}
export const serializeProject = (design: Design) =>
  JSON.stringify(validateDesign(design), null, 2) + "\n";

export function presentation(
  element: FaceElement,
): NonNullable<FaceElement["presentation"]> {
  const source = element.complication?.source ?? element.type;
  return (
    element.presentation ?? {
      variant: layerVariants(element.type)[0],
      width: element.type === "chart" ? 240 : 96,
      height: 96,
      stroke: 4,
      goal: isMetric(source) ? METRICS[source].goal : 10000,
      source: "steps",
      image: "",
    }
  );
}
export function validateImage(data: string) {
  if (
    !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data) ||
    data.length > MAX_IMAGE_DATA_LENGTH
  )
    throw new Error("Use a PNG image up to 256 KB.");
  const bytes = Uint8Array.from(atob(data.split(",")[1]), (c) =>
    c.charCodeAt(0),
  );
  const view = new DataView(bytes.buffer);
  if (
    bytes.length < 33 ||
    view.getUint32(0) !== 0x89504e47 ||
    view.getUint32(4) !== 0x0d0a1a0a ||
    view.getUint32(12) !== 0x49484452 ||
    view.getUint32(16) < 1 ||
    view.getUint32(20) < 1 ||
    view.getUint32(16) > DEVICE.width ||
    view.getUint32(20) > DEVICE.height
  )
    throw new Error(
      `PNG dimensions must be 1–${DEVICE.width} × 1–${DEVICE.height} pixels.`,
    );
}

/** These supported devices share a 454px canvas; preserve layout and gate interactions. */
export function designForDevice(design: Design, deviceId: string): Design {
  const device = getDeviceById(deviceId);
  if (!device?.supported) throw new Error("Choose a supported watch.");
  const elements = (items: FaceElement[]) =>
    items.map((e) => ({
      ...e,
      ...(e.openOnHold !== undefined
        ? { openOnHold: e.openOnHold && device.capabilities.complicationHold }
        : {}),
      ...(e.complication
        ? {
            complication: {
              ...e.complication,
              openOnHold:
                e.complication.openOnHold &&
                device.capabilities.complicationHold,
            },
          }
        : {}),
    }));
  return validateDesign({
    ...design,
    device: device.id,
    onWatch: Boolean(design.onWatch && device.capabilities.onWatchSettings),
    elements: elements(design.elements),
    ...(design.layouts
      ? {
          layouts: Object.fromEntries(
            Object.entries(design.layouts).map(([mode, layout]) => [
              mode,
              { ...layout, elements: elements(layout.elements) },
            ]),
          ),
        }
      : {}),
  });
}

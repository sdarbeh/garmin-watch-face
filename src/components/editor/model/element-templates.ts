import type { Device } from "@/devices/catalog";
import { supportsLayer } from "@/watchface/capabilities";
import { supportsComplication } from "@/watchface/complications";
import {
  createElement,
  presentation,
  type ElementType,
  type FaceElement,
} from "@/watchface/schema";
import { normalizeSearchText } from "./layer-search";

export type ElementTemplateCategoryId =
  "time" | "health" | "activity" | "weather" | "system" | "visuals";

export type ElementTemplatePatch = Omit<Partial<FaceElement>, "id" | "type">;

export interface ElementTemplateCategory {
  id: ElementTemplateCategoryId;
  label: string;
  icon: ElementType;
}

export interface ElementTemplate {
  id: string;
  category: ElementTemplateCategoryId;
  label: string;
  description: string;
  layerType: ElementType;
  keywords: readonly string[];
  patch?: ElementTemplatePatch;
}

export const ELEMENT_TEMPLATE_CATEGORIES: readonly ElementTemplateCategory[] = [
  { id: "time", label: "Time & date", icon: "time" },
  { id: "health", label: "Health", icon: "heartRate" },
  { id: "activity", label: "Activity", icon: "activeMinutes" },
  { id: "weather", label: "Weather", icon: "weather" },
  { id: "system", label: "System", icon: "status" },
  { id: "visuals", label: "Visuals", icon: "shape" },
];

function presentationPatch(
  type: ElementType,
  variant: string,
  patch: Partial<ReturnType<typeof presentation>> = {},
): ElementTemplatePatch {
  return {
    presentation: {
      ...presentation(createElement(type, "template")),
      ...patch,
      variant,
    },
  };
}

export const ELEMENT_TEMPLATES: readonly ElementTemplate[] = [
  {
    id: "large-digital-time",
    category: "time",
    label: "Large digital time",
    description: "Prominent hours and minutes",
    layerType: "time",
    keywords: ["clock", "hours", "minutes", "large"],
    patch: { size: 96 },
  },
  {
    id: "small-digital-time",
    category: "time",
    label: "Small digital time",
    description: "Compact hours and minutes",
    layerType: "time",
    keywords: ["clock", "hours", "minutes", "compact"],
    patch: { size: 40 },
  },
  {
    id: "analog-hands",
    category: "time",
    label: "Analog hands",
    description: "Centered hour and minute hands",
    layerType: "time",
    keywords: ["clock", "dial", "hands"],
    patch: presentationPatch("time", "analog", { width: 280, height: 280 }),
  },
  {
    id: "full-date",
    category: "time",
    label: "Full date",
    description: "Weekday, day, month, and year",
    layerType: "date",
    keywords: ["calendar", "weekday", "month", "year"],
    patch: { ...presentationPatch("date", "full"), size: 32 },
  },
  {
    id: "heart-rate",
    category: "health",
    label: "Heart rate",
    description: "Current heart rate in bpm",
    layerType: "heartRate",
    keywords: ["pulse", "bpm", "health"],
  },
  {
    id: "body-battery",
    category: "health",
    label: "Body Battery",
    description: "Current energy level",
    layerType: "bodyBattery",
    keywords: ["energy", "wellness", "garmin"],
  },
  {
    id: "stress",
    category: "health",
    label: "Stress",
    description: "Current stress level",
    layerType: "stress",
    keywords: ["wellness", "relaxation"],
  },
  {
    id: "recovery",
    category: "health",
    label: "Recovery",
    description: "Estimated recovery time",
    layerType: "recovery",
    keywords: ["training", "rest", "readiness"],
  },
  {
    id: "steps",
    category: "activity",
    label: "Steps",
    description: "Daily step count",
    layerType: "steps",
    keywords: ["walk", "goal", "pedometer"],
  },
  {
    id: "distance",
    category: "activity",
    label: "Distance",
    description: "Distance traveled today",
    layerType: "distance",
    keywords: ["miles", "kilometers", "run", "ride"],
  },
  {
    id: "calories",
    category: "activity",
    label: "Calories",
    description: "Daily calories burned",
    layerType: "calories",
    keywords: ["energy", "kcal"],
  },
  {
    id: "floors",
    category: "activity",
    label: "Floors",
    description: "Floors climbed today",
    layerType: "floors",
    keywords: ["stairs", "elevation", "climbed"],
  },
  {
    id: "active-minutes",
    category: "activity",
    label: "Active minutes",
    description: "Daily intensity minutes",
    layerType: "activeMinutes",
    keywords: ["exercise", "intensity", "weekly"],
  },
  {
    id: "weather-condition",
    category: "weather",
    label: "Condition icon",
    description: "Dynamic sun, cloud, and rain icon",
    layerType: "weather",
    keywords: ["forecast", "sun", "cloud", "rain", "icon"],
    patch: presentationPatch("weather", "condition-icon", {
      width: 72,
      height: 72,
    }),
  },
  ...[
    ["temperature", "Temperature", "Current temperature"],
    ["humidity", "Humidity", "Current humidity percentage"],
    ["wind", "Wind", "Current wind speed"],
    ["sunrise", "Sunrise", "Today’s sunrise time"],
    ["sunset", "Sunset", "Today’s sunset time"],
  ].map(([variant, label, description]) => ({
    id: `weather-${variant}`,
    category: "weather" as const,
    label,
    description,
    layerType: "weather" as const,
    keywords: ["weather", "forecast", variant],
    patch: presentationPatch("weather", variant),
  })),
  {
    id: "device-battery",
    category: "system",
    label: "Device battery",
    description: "Remaining watch battery",
    layerType: "battery",
    keywords: ["power", "charge", "percentage"],
  },
  {
    id: "notifications",
    category: "system",
    label: "Notifications",
    description: "Unread notification count",
    layerType: "complication",
    keywords: ["alerts", "messages", "count"],
    patch: {
      complication: {
        source: "notifications",
        showUnit: false,
        openOnHold: false,
      },
    },
  },
  ...[
    ["training-status", "Training status", "Current training state"],
    ["calendar-event", "Next calendar event", "Time of the next event"],
  ].map(([variant, label, description]) => ({
    id: variant,
    category: "system" as const,
    label,
    description,
    layerType: "status" as const,
    keywords: ["system", "status", variant],
    patch: presentationPatch("status", variant),
  })),
  {
    id: "custom-complication",
    category: "system",
    label: "Complication",
    description: "Configurable Garmin data source",
    layerType: "complication",
    keywords: ["data", "metric", "shortcut", "widget"],
  },
  {
    id: "text",
    category: "visuals",
    label: "Text",
    description: "Custom text label",
    layerType: "text",
    keywords: ["copy", "label", "words"],
  },
  {
    id: "shape",
    category: "visuals",
    label: "Shape",
    description: "Circle, rectangle, line, or dial",
    layerType: "shape",
    keywords: ["circle", "rectangle", "line", "dial", "divider"],
  },
  {
    id: "icon",
    category: "visuals",
    label: "Icon",
    description: "Symbol for a watch face",
    layerType: "icon",
    keywords: ["symbol", "heart", "star", "sun"],
  },
  {
    id: "image",
    category: "visuals",
    label: "Image",
    description: "Custom PNG or pixel artwork",
    layerType: "image",
    keywords: ["photo", "picture", "png", "artwork"],
  },
  {
    id: "goal-progress",
    category: "visuals",
    label: "Goal progress",
    description: "Ring or bar linked to a goal",
    layerType: "progress",
    keywords: ["ring", "bar", "gauge", "steps"],
  },
  {
    id: "history-chart",
    category: "visuals",
    label: "History chart",
    description: "Line or bar chart from sensor history",
    layerType: "chart",
    keywords: ["graph", "trend", "history", "line", "bar"],
  },
];

export function templatesForDevice(device: Device) {
  return ELEMENT_TEMPLATES.filter((template) => {
    if (!supportsLayer(device, template.layerType)) return false;
    if (template.layerType !== "complication") return true;
    const source = template.patch?.complication?.source ?? "heartRate";
    return supportsComplication(device, source);
  });
}

function templateScore(template: ElementTemplate, query: string) {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return 1;
  const label = normalizeSearchText(template.label);
  const terms = normalizeSearchText(
    `${template.label} ${template.description} ${template.keywords.join(" ")}`,
  );
  if (!tokens.every((token) => terms.includes(token))) return 0;
  return tokens.reduce((score, token) => {
    if (label === token) return score + 100;
    if (label.startsWith(token)) return score + 60;
    return score + 20;
  }, 0);
}

export function searchElementTemplates(
  templates: readonly ElementTemplate[],
  query: string,
) {
  if (!normalizeSearchText(query)) return templates;
  return templates
    .map((template, index) => ({
      template,
      index,
      score: templateScore(template, query),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ template }) => template);
}

export function elementTemplate(id: string) {
  return ELEMENT_TEMPLATES.find((template) => template.id === id);
}

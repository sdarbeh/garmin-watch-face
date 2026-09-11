import type { ElementType } from "@/watchface/schema";
import { LAYER_LABELS } from "../types";

const LAYER_ALIASES: Record<ElementType, readonly string[]> = {
  time: ["clock", "hour", "minute", "seconds", "digital", "analog"],
  date: ["calendar", "day", "month", "year"],
  steps: ["walk", "walking", "pedometer", "goal"],
  battery: ["power", "charge", "percentage"],
  text: ["label", "words", "copy"],
  heartRate: ["heart", "pulse", "bpm", "hr", "health"],
  calories: ["energy", "kcal", "activity"],
  distance: ["miles", "kilometers", "run", "ride"],
  floors: ["stairs", "climbed", "elevation"],
  activeMinutes: ["activity", "exercise", "intensity", "weekly"],
  bodyBattery: ["energy", "wellness", "garmin"],
  stress: ["wellness", "health", "relaxation"],
  recovery: ["rest", "training", "readiness"],
  weather: [
    "temperature",
    "forecast",
    "condition",
    "sun",
    "rain",
    "wind",
    "humidity",
    "sunrise",
    "sunset",
  ],
  progress: ["goal", "ring", "bar", "gauge"],
  chart: ["graph", "history", "trend", "line", "bar"],
  complication: ["data", "widget", "metric", "shortcut"],
  status: ["dnd", "bluetooth", "phone", "alarm", "notifications", "connection"],
  shape: ["circle", "rectangle", "line", "arc", "dial", "divider"],
  icon: ["symbol", "heart", "star", "sun"],
  image: ["photo", "picture", "png", "pixel", "artwork"],
};

export function normalizeSearchText(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenScore(token: string, words: string[], aliases: string[]): number {
  if (words.includes(token)) return 80;
  if (words.some((word) => word.startsWith(token))) return 60;
  if (aliases.includes(token)) return 50;
  if (aliases.some((alias) => alias.startsWith(token))) return 40;
  return 0;
}

function scoreLayer(
  type: ElementType,
  query: string,
  extraTerms: string[] = [],
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;
  const name = normalizeSearchText(
    `${LAYER_LABELS[type]} ${type} ${extraTerms.join(" ")}`,
  );
  const words = name.split(/\s+/);
  const aliases = LAYER_ALIASES[type].map(normalizeSearchText);
  const scores = normalizedQuery
    .split(/\s+/)
    .map((token) => tokenScore(token, words, aliases));
  if (!scores.every(Boolean)) return 0;
  return (
    scores.reduce((sum, value) => sum + value, 0) +
    (name.startsWith(normalizedQuery) ? 100 : 0)
  );
}

/** Filters a placed layer without changing its visual stack order. */
export function matchesLayerQuery(
  type: ElementType,
  query: string,
  extraTerms: string[] = [],
) {
  return scoreLayer(type, query, extraTerms) > 0;
}

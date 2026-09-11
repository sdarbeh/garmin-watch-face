import { COMPLICATIONS } from "@/watchface/complications";
import { METRICS, type Metric } from "@/watchface/layer-catalog";
import type { ElementId, ElementType } from "@/watchface/schema";

export type EditorSelection = ElementId | "background";
export interface EditorPoint {
  x: number;
  y: number;
}
export const LAYER_LABELS: Record<ElementType | Metric | "background", string> =
  {
    ...(Object.fromEntries(
      Object.entries(METRICS).map(([key, value]) => [key, value.label]),
    ) as Record<keyof typeof METRICS, string>),
    progress: "Progress",
    chart: "Chart",
    complication: "Complication",
    status: "Status",
    shape: "Shape",
    icon: "Icon",
    image: "Image",
    text: "Text",
    time: "Time",
    date: "Date",
    steps: "Steps",
    battery: "Battery",
    background: "Background",
  };

export function layerLabel(element: import("@/watchface/schema").FaceElement) {
  if (element.complication)
    return COMPLICATIONS[element.complication.source].label;
  if (
    element.type === "weather" &&
    element.presentation?.variant === "condition-icon"
  )
    return "Weather icon";
  if (element.type === "text") return element.text || "Empty text";
  return LAYER_LABELS[element.type];
}

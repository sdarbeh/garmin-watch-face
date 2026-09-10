import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
import type { ElementType } from "@/watchface/schema";

// Exhaustive mapping: new layer types must supply their own icon.
const paths: Record<ElementType | "background", string> = {
  time: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  date: "M4 6h16v14H4zM8 3v6M16 3v6M4 11h16",
  steps: "M8 4c-3 0-4 8-1 9s5-8 1-9ZM7 16v3M16 8c-3 0-4 8-1 9s5-8 1-9ZM15 20v1",
  battery: "M3 7h16v10H3zM21 10v4M6 10v4M9 10v4",
  text: "M5 5h14M12 5v14M8 19h8",
  heartRate:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8ZM4 12h4l2-4 4 8 2-4h4",
  calories:
    "M12 3c1 5-5 6-5 10a5 5 0 0 0 10 0c0-2-1-4-2-5 0 3-2 3-2 3 1-4 0-6-1-8ZM12 14c-3 3-2 6 0 6s3-3 0-6Z",
  distance:
    "M7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM21 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM9 5h7a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h5",
  floors: "M3 20h6v-5h6v-5h6V4M3 12V4h8M3 4l7 7",
  activeMinutes:
    "M9 2h6M12 2v3M18 5l2 2M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM12 9v4l-3 2",
  bodyBattery: "M13 2 4 14h7l-1 8 10-13h-7l1-7Z",
  stress: "M3 12h3l3-8 6 16 3-8h3M4 5h1M19 19h1",
  recovery: "M20 4C9 2 3 7 5 14c2 7 13 6 15-10ZM5 21l10-12M10 16v-5M10 16h5",
  weather:
    "M10 13a4 4 0 1 0-5-5M7 2v1M2 7h1M3 3l1 1M12 3l-1 1M7 20h11a4 4 0 0 0 0-8h-1a5 5 0 0 0-10 1 3.5 3.5 0 0 0 0 7Z",
  status: "M4 4h16v12H9l-5 4V4ZM8 8h8M8 12h5",
  complication:
    "M8 3v4M16 3v4M8 17v4M16 17v4M3 8h4M3 16h4M17 8h4M17 16h4M7 7h10v10H7zM10 10h4v4h-4z",
  chart: "M3 3v18h18M6 15l4-6 4 3 6-7",
  progress: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M16 3v5h5",
  shape: "M3 3h8v8H3zM16 12l5 9H11l5-9Z",
  icon: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  image: "M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M17 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  background: "m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
};
export function LayerIcon({
  type,
  ...props
}: IconProps & { type: ElementType | "background" }) {
  return (
    <AppIcon {...props}>
      <path d={paths[type]} />
    </AppIcon>
  );
}

import type { DisplayMode } from "./simulation";

export const EDITOR_MODE_OPTIONS: ReadonlyArray<{
  id: DisplayMode;
  label: string;
}> = [
  { id: "normal", label: "Normal" },
  { id: "always-on", label: "Always-on" },
  { id: "low-battery", label: "Low battery" },
  { id: "night", label: "Night" },
];

export const EDITOR_MODE_LABELS = Object.fromEntries(
  EDITOR_MODE_OPTIONS.map(({ id, label }) => [id, label]),
) as Record<DisplayMode, string>;

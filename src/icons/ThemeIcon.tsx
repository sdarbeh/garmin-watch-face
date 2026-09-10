import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function ThemeIcon({
  mode,
  ...props
}: IconProps & { mode: "light" | "dark" }) {
  if (mode === "dark")
    return (
      <AppIcon {...props}>
        <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />
      </AppIcon>
    );
  return (
    <AppIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </AppIcon>
  );
}

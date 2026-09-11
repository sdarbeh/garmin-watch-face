import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function SnapIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M5 4v9a7 7 0 0 0 14 0V4" />
      <path d="M5 8h4V4M15 4v4h4" />
    </AppIcon>
  );
}

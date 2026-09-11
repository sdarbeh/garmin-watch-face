import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function WarningIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M10.3 4.2 2.7 17.4A1.8 1.8 0 0 0 4.3 20h15.4a1.8 1.8 0 0 0 1.6-2.6L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </AppIcon>
  );
}

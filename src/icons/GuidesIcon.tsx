import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function GuidesIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 12h18" strokeDasharray="2 2" />
    </AppIcon>
  );
}

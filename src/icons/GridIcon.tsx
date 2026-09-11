import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function GridIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </AppIcon>
  );
}

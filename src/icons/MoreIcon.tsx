import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function MoreIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </AppIcon>
  );
}

import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function CheckCircleIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </AppIcon>
  );
}

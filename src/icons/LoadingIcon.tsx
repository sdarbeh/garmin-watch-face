import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function LoadingIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </AppIcon>
  );
}

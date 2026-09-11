import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function MinusIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M5 12h14" />
    </AppIcon>
  );
}

import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function RedoIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="m16 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12h3" />
    </AppIcon>
  );
}

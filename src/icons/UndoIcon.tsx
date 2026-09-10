import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function UndoIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12h-3" />
    </AppIcon>
  );
}

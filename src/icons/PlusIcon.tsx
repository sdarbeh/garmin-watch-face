import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function PlusIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </AppIcon>
  );
}

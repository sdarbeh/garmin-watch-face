import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function ArrowRightIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </AppIcon>
  );
}

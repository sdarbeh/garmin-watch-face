import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function SearchIcon(props: IconProps) {
  return (
    <AppIcon {...props} strokeWidth="1.5">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </AppIcon>
  );
}

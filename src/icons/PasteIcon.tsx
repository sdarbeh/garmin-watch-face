import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function PasteIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M9 5H6a2 2 0 0 0-2 2v13h12v-3" />
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <rect x="11" y="10" width="9" height="10" rx="2" />
    </AppIcon>
  );
}

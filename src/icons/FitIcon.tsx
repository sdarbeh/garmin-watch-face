import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function FitIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
      <path d="m8 8-4-4m12 4 4-4m-4 12 4 4M8 16l-4 4" />
    </AppIcon>
  );
}

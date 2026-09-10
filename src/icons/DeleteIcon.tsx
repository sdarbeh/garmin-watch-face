import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function DeleteIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </AppIcon>
  );
}

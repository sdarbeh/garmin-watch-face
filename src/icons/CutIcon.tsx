import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function CutIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="m8.5 7.5 11 7M8.5 16.5 19.5 9M14 12l-2-1.25" />
    </AppIcon>
  );
}

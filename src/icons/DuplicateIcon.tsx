import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function DuplicateIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
    </AppIcon>
  );
}

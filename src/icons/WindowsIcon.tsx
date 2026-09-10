import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function WindowsIcon(props: IconProps) {
  return (
    <AppIcon {...props} fill="currentColor" stroke="none">
      <path
        d="M2 3h9v9H2zM13 3h9v9h-9zM2 14h9v9H2zM13 14h9v9h-9z"
        transform="translate(0 -1)"
      />
    </AppIcon>
  );
}

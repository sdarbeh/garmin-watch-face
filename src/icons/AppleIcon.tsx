import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function AppleIcon(props: IconProps) {
  return (
    <AppIcon {...props} fill="currentColor" stroke="none">
      <path d="M16.4 1.5c.2 1.4-.4 2.8-1.2 3.7-.9 1-2.1 1.6-3.4 1.5-.2-1.3.4-2.7 1.2-3.6.9-1 2.3-1.6 3.4-1.6ZM20.6 17.4c-.5 1.2-.8 1.8-1.5 2.8-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-3.8-1s-2.3 1-3.8 1c-1.7 0-2.9-1.5-3.9-2.9C.8 16.5.5 11.6 2.3 8.9c1.2-1.9 3.1-2.9 4.9-2.9 1.6 0 2.6 1 3.9 1 1.2 0 2-1 3.9-1 1.5 0 3.2.8 4.4 2.2-3.8 2.1-3.2 7.6 1.2 9.2Z" />
    </AppIcon>
  );
}

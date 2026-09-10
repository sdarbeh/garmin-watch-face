import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function VisibilityIcon({
  visible,
  ...props
}: IconProps & { visible: boolean }) {
  return (
    <AppIcon {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible && <path d="m3 3 18 18" />}
    </AppIcon>
  );
}

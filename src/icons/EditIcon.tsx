import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function EditIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M13.5 6.5 17.5 10.5" />
      <path d="M4 20h4l10.5-10.5a2.83 2.83 0 0 0-4-4L4 16v4Z" />
    </AppIcon>
  );
}

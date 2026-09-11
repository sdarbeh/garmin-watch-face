import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function DownloadIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M12 3v13m-4-4 4 4 4-4M4 15v5h16v-5" />
    </AppIcon>
  );
}

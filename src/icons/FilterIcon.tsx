import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function FilterIcon(props: IconProps) {
  return (
    <AppIcon
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </AppIcon>
  );
}

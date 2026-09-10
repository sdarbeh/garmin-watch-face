import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function SortIcon({
  descending,
  ...props
}: IconProps & { descending: boolean }) {
  return (
    <AppIcon
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 19V5m-4 4 4-4 4 4" opacity={descending ? 0.35 : 1} />
      <path d="M17 5v14m-4-4 4 4 4-4" opacity={descending ? 1 : 0.35} />
    </AppIcon>
  );
}

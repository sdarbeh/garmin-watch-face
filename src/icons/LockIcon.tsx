import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
export function LockIcon({
  locked,
  ...props
}: IconProps & { locked: boolean }) {
  return (
    <AppIcon {...props}>
      <path
        d={
          locked
            ? "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3"
            : "M9 10V6a5 5 0 0 1 10 0M3 10h14v11H3zM10 14v3"
        }
      />
    </AppIcon>
  );
}

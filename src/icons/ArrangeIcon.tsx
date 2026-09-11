import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function ArrangeIcon({
  placement,
  ...props
}: IconProps & { placement: "forward" | "backward" | "front" | "back" }) {
  if (placement === "forward") {
    return (
      <AppIcon {...props}>
        <path d="M5 19h14M5 15h14M12 12V4m-4 4 4-4 4 4" />
      </AppIcon>
    );
  }
  if (placement === "backward") {
    return (
      <AppIcon {...props}>
        <path d="M5 5h14M5 9h14m-7 3v8m-4-4 4 4 4-4" />
      </AppIcon>
    );
  }
  if (placement === "front") {
    return (
      <AppIcon {...props}>
        <path d="M5 4h14M12 20V7m-4 4 4-4 4 4" />
      </AppIcon>
    );
  }
  return (
    <AppIcon {...props}>
      <path d="M5 20h14M12 4v13m-4-4 4 4 4-4" />
    </AppIcon>
  );
}

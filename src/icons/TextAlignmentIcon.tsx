import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";
const lines = {
  left: "M4 5h16M4 10h10M4 15h16M4 20h10",
  center: "M4 5h16M7 10h10M4 15h16M7 20h10",
  right: "M4 5h16M10 10h10M4 15h16M10 20h10",
};
export function TextAlignmentIcon({
  alignment,
  ...props
}: IconProps & { alignment: "left" | "center" | "right" }) {
  return (
    <AppIcon {...props}>
      <path d={lines[alignment]} />
    </AppIcon>
  );
}

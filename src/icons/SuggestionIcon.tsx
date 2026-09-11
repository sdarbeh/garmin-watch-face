import { AppIcon } from "./AppIcon";
import type { IconProps } from "./types";

export function SuggestionIcon(props: IconProps) {
  return (
    <AppIcon {...props}>
      <path d="M12 3.5 13.4 7a5.5 5.5 0 0 0 3.1 3.1L20 11.5 16.5 13a5.5 5.5 0 0 0-3.1 3.1L12 19.5l-1.4-3.4A5.5 5.5 0 0 0 7.5 13L4 11.5l3.5-1.4A5.5 5.5 0 0 0 10.6 7L12 3.5Z" />
      <path d="m19 3 .4 1.1c.2.5.6.9 1.1 1.1l1 .3-1 .4c-.5.2-.9.6-1.1 1.1L19 8l-.4-1c-.2-.5-.6-.9-1.1-1.1l-1-.4 1-.3c.5-.2.9-.6 1.1-1.1L19 3Z" />
    </AppIcon>
  );
}

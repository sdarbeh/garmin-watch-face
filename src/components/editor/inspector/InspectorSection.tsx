import { useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@/icons";

export function InspectorSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="watchface-property-section"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="watchface-property-section__summary">
        <span>{title}</span>
        <ChevronRightIcon size="sm" />
      </summary>
      <div className="watchface-property-section__body">{children}</div>
    </details>
  );
}

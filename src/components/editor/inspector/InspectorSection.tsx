import { useId, useState, type ReactNode, type Ref } from "react";
import { ChevronRightIcon } from "@/icons";
import { cx } from "@/utils/css";

export function InspectorSection({
  title,
  defaultOpen = false,
  open,
  className,
  children,
  onOpenChange,
  summaryRef,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  className?: string;
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
  summaryRef?: Ref<HTMLButtonElement>;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const resolvedOpen = open ?? internalOpen;
  const headingId = useId();

  return (
    <section
      className={cx("watchface-property-section", className)}
      data-open={resolvedOpen}
    >
      <button
        ref={summaryRef}
        id={headingId}
        type="button"
        className="watchface-property-section__summary"
        aria-expanded={resolvedOpen}
        onClick={() => {
          const nextOpen = !resolvedOpen;
          if (open === undefined) setInternalOpen(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      >
        <span>{title}</span>
        <ChevronRightIcon size="sm" />
      </button>
      <div
        className="watchface-property-section__drawer"
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!resolvedOpen}
        inert={!resolvedOpen}
      >
        <div className="watchface-property-section__body">{children}</div>
      </div>
    </section>
  );
}

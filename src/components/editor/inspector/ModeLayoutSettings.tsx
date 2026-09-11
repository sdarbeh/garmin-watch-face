import { Button } from "@/components/ui";
import type { PowerMode } from "@/watchface/power";
import type { Design } from "@/watchface/schema";
import { InspectorSection } from "./InspectorSection";

export function ModeLayoutSettings({
  design,
  mode,
  disabled,
  onReset,
}: {
  design: Design;
  mode: PowerMode;
  disabled: boolean;
  onReset: () => void;
}) {
  if (mode === "normal") return null;
  const hasOverride = Boolean(design.layouts?.[mode]);

  return (
    <InspectorSection title="Mode settings" defaultOpen>
      <p className="u-font-xs u-text-secondary mb3">
        {hasOverride
          ? "This mode has custom overrides. Reset it to use the initial layout."
          : "This mode inherits its layout until you make an edit."}
      </p>
      {hasOverride && (
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onReset}>
          Reset to initial design
        </Button>
      )}
    </InspectorSection>
  );
}

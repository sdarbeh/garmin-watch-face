import type { KeyboardEvent } from "react";
import type { Device } from "@/devices/catalog";
import { Button } from "@/components/ui";
import { supportsMode } from "@/watchface/capabilities";
import { EDITOR_MODE_OPTIONS } from "@/components/editor/model/display-modes";
import type { DisplayMode } from "@/components/editor/model/simulation";

const MODE_LABELS: Record<DisplayMode, string> = {
  normal: "Normal",
  "always-on": "AOD",
  "low-battery": "Low",
  night: "Night",
};

export function FooterDisplayControls({
  ready,
  device,
  mode,
  onModeChange,
}: {
  ready: boolean;
  device: Device;
  mode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
}) {
  const modes = EDITOR_MODE_OPTIONS.filter(({ id }) =>
    supportsMode(device, id),
  );

  function handleModeKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex = index;
    if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + modes.length) % modes.length;
    else if (event.key === "ArrowRight") nextIndex = (index + 1) % modes.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = modes.length - 1;
    else return;

    event.preventDefault();
    const nextMode = modes[nextIndex];
    onModeChange(nextMode.id);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        "[data-display-mode]",
      );
    buttons?.[nextIndex]?.focus();
  }

  return (
    <div className="watchface-footer__display" aria-label="Display preview">
      <div
        className="watchface-footer__segments u-radius-pill"
        role="group"
        aria-label="Display mode"
      >
        {modes.map(({ id, label }, index) => (
          <Button
            key={id}
            size="sm"
            variant="ghost"
            className="watchface-footer__mode u-flex-1 u-radius-pill px3"
            active={mode === id}
            aria-label={label}
            aria-pressed={mode === id}
            disabled={!ready}
            tabIndex={mode === id ? 0 : -1}
            data-display-mode
            onKeyDown={(event) => handleModeKeyDown(event, index)}
            onClick={() => onModeChange(id)}
          >
            {MODE_LABELS[id]}
          </Button>
        ))}
      </div>
    </div>
  );
}

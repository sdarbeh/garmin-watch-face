import type { KeyboardEvent } from "react";
import type { Device } from "@/devices/catalog";
import { Button } from "@/components/ui";
import { supportsMode } from "@/watchface/capabilities";
import { EDITOR_MODE_OPTIONS } from "../model/display-modes";
import type { DisplayMode } from "../model/simulation";

const SHORT_MODE_LABELS: Partial<Record<DisplayMode, string>> = {
  "always-on": "AOD",
  "low-battery": "Low",
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
        className="watchface-footer__segments"
        role="group"
        aria-label="Display mode"
      >
        {modes.map(({ id, label }, index) => (
          <Button
            key={id}
            size="sm"
            variant="ghost"
            active={mode === id}
            aria-label={label}
            aria-pressed={mode === id}
            disabled={!ready}
            tabIndex={mode === id ? 0 : -1}
            data-display-mode
            onKeyDown={(event) => handleModeKeyDown(event, index)}
            onClick={() => onModeChange(id)}
          >
            <span className="watchface-footer__mode-label">{label}</span>
            <span
              className="watchface-footer__mode-label-short"
              aria-hidden="true"
            >
              {SHORT_MODE_LABELS[id] ?? label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

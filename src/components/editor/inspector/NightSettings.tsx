import { InspectorSection } from "./InspectorSection";
import { useState } from "react";
import type { Design } from "@/watchface/schema";
import { getDeviceById } from "@/devices/catalog";

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export function NightSettings({
  design,
  disabled,
  onChange,
}: {
  design: Design;
  disabled: boolean;
  onChange: (design: Design) => void;
}) {
  const [error, setError] = useState("");
  const settings = design.night ?? {
    enabled: false,
    trigger: "dnd" as const,
    start: 1320,
    end: 420,
  };
  const device = getDeviceById(design.device)!;
  if (!device.capabilities.nightLayout) return null;
  function update(patch: Partial<NonNullable<Design["night"]>>) {
    const next = { ...settings, ...patch };
    if (next.start === next.end) {
      setError("Start and end times must differ.");
      return;
    }
    setError("");
    onChange({ ...design, night: next });
  }
  return (
    <InspectorSection title="Night layout">
      <label className="watchface-property-row u-font-xs mb3">
        Enable night layout
        <input
          type="checkbox"
          disabled={disabled}
          checked={settings.enabled}
          onChange={(event) => update({ enabled: event.target.checked })}
        />
      </label>
      {settings.enabled && (
        <>
          <label className="watchface-property-row ui-field u-font-xs mb3">
            Trigger
            <select
              disabled={disabled}
              value={settings.trigger}
              onChange={(event) =>
                update({ trigger: event.target.value as "dnd" | "schedule" })
              }
            >
              {device.capabilities.doNotDisturb && (
                <option value="dnd">Do Not Disturb</option>
              )}
              <option value="schedule">Scheduled hours</option>
            </select>
          </label>
          {settings.trigger === "schedule" &&
            (["start", "end"] as const).map((key) => (
              <label
                key={key}
                className="watchface-property-row ui-field u-font-xs mb2"
              >
                {key === "start" ? "Starts" : "Ends"}
                <input
                  type="time"
                  disabled={disabled}
                  value={clock(settings[key])}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    const [hours, minutes] = event.target.value
                      .split(":")
                      .map(Number);
                    update({ [key]: hours * 60 + minutes });
                  }}
                />
              </label>
            ))}
          {error && (
            <p role="alert" className="u-font-xs u-text-danger">
              {error}
            </p>
          )}
          <p className="u-font-xs u-text-secondary">
            Edit layers in Night mode. Schedules use watch time. Always-on and
            low battery take priority.
          </p>
        </>
      )}
    </InspectorSection>
  );
}

"use client";

import { designForDevice } from "@/watchface/schema";
import Link from "next/link";
import type { Device } from "@/devices/catalog";
import type { Preset } from "@/presets/catalog";
import { WatchPreview } from "@/components/editor/canvas/WatchPreview";
import { getButtonClassName } from "@/components/ui/button/button-styles";
import { ArrowRightIcon } from "@/icons";
import { browserLibrary } from "@/library/store";
import {
  newDesignSession,
  newDesignSource,
} from "@/library/new-design-session";

export function WatchPresetCard({
  preset,
  device,
}: {
  preset: Preset;
  device: Device;
}) {
  return (
    <Link
      className="watch-preset"
      href={`/editor/new?${new URLSearchParams({ preset: preset.slug, watch: device.slug })}`}
      aria-label={`Edit ${preset.name} for ${device.name}`}
      onNavigate={() => {
        browserLibrary.selectWatch(device.id);
        newDesignSession.begin(newDesignSource(device.id, preset.slug));
      }}
    >
      <div className="watch-preset__preview">
        <WatchPreview
          design={designForDevice(preset.design, device.id)}
          selected={null}
        />
        <span
          aria-hidden="true"
          className={getButtonClassName({
            variant: "primary",
            size: "sm",
            className: "watch-preset__action",
          })}
        >
          Edit <ArrowRightIcon size="sm" />
        </span>
      </div>
      <h3 className="u-font-md u-weight-semibold mt3">{preset.name}</h3>
    </Link>
  );
}

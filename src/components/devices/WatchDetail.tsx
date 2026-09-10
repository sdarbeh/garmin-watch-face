"use client";
import Image from "next/image";
import type { Device } from "@/devices/catalog";
import { presets } from "@/presets/catalog";
import { Button } from "@/components/ui";
import { StartDesignButton } from "@/components/library/StartDesignButton";
import { WatchPresetCard } from "./WatchPresetCard";
import { ChevronLeftIcon, ArrowRightIcon } from "@/icons";

export function WatchDetail({ device }: { device: Device }) {
  const compatible = presets.filter((preset) =>
    preset.compatibleDevices.includes(device.id),
  );
  return (
    <section className="studio-page u-grid gap3">
      <div>
        <Button
          href="/watches"
          variant="ghost"
          size="sm"
          className="studio-text-link"
        >
          <ChevronLeftIcon size="sm" />
          Watches
        </Button>
      </div>
      <div className="watch-detail">
        <div className="watch-detail__preview">
          <Image
            src={device.preview}
            alt={device.name}
            width={600}
            height={600}
            loading="eager"
          />
        </div>
        <div className="watch-detail__info">
          <div className="u-grid gap2">
            <h1 className="watch-detail__title">{device.name}</h1>
            <p className="u-font-md u-text-secondary">
              {device.width} × {device.height} · {device.display} ·{" "}
              {device.shape} display
            </p>
          </div>
          <p className="u-font-md u-text-secondary">
            Design a face built for the {device.name} display and capabilities.
          </p>
          <dl className="watch-detail__specs">
            <dt>Canvas</dt>
            <dd>
              {device.width} × {device.height} px
            </dd>
            <dt>Display</dt>
            <dd>{device.display}</dd>
            <dt>Shape</dt>
            <dd>{device.shape}</dd>
            <dt>Always-on</dt>
            <dd>
              {device.capabilities.alwaysOn ? "Supported" : "Unavailable"}
            </dd>
            <dt>Low battery</dt>
            <dd>
              {device.capabilities.lowBattery ? "Supported" : "Unavailable"}
            </dd>
          </dl>
          <div className="u-flex">
            <StartDesignButton watchId={device.id} variant="primary">
              Create a blank face <ArrowRightIcon size="sm" />
            </StartDesignButton>
          </div>
        </div>
      </div>
      {compatible.length > 0 && (
        <section className="studio-home__section">
          <h2 className="u-font-xl u-weight-semibold mb4">
            Compatible presets
          </h2>
          <div className="watch-preset-grid">
            {compatible.map((preset) => (
              <WatchPresetCard
                key={preset.slug}
                preset={preset}
                device={device}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

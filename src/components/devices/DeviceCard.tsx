"use client";
import { browserLibrary } from "@/library/store";
import { DeviceTags } from "./DeviceTags";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/icons";
import type { Device } from "@/devices/catalog";

export function DeviceCard({
  device,
  href,
  onSelect,
  compatible,
}: {
  device: Device;
  href?: string;
  onSelect?: () => void;
  compatible?: boolean;
}) {
  return (
    <Link
      href={href ?? `/watches/${device.slug}`}
      onNavigate={(event) => {
        if (compatible === false) event.preventDefault();
        else {
          browserLibrary.selectWatch(device.id);
          onSelect?.();
        }
      }}
      aria-disabled={compatible === false || undefined}
      tabIndex={compatible === false ? -1 : undefined}
      className="device-card u-grid"
      aria-label={`${href ? "Choose" : "View"} ${device.name}`}
    >
      <div className="device-card__image">
        <Image
          src={device.preview}
          alt={device.name}
          width={400}
          height={400}
          className="device-card__watch"
          loading="eager"
        />
      </div>
      <div className="device-card__content u-flex u-flex-column gap2">
        <h3 className="u-font-md u-weight-semibold">{device.name}</h3>
        <p className="u-font-sm u-text-secondary">
          {device.width} × {device.height} · {device.display}
        </p>
        <DeviceTags device={device} />
        {compatible !== undefined && (
          <span className="u-font-xs u-text-secondary">
            {compatible ? "Compatible" : "Not compatible"}
          </span>
        )}
        <span className="device-card__action u-inline-flex u-items-center u-justify-center">
          <span className="device-card__action-label">
            {href ? "Customize" : "View watch"}
          </span>
          <ArrowRightIcon size="sm" />
        </span>
      </div>
    </Link>
  );
}

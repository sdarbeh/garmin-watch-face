import type { Device } from "@/devices/catalog";

export function DeviceTags({ device }: { device: Device }) {
  return (
    <div className="device-tags u-flex u-flex-wrap gap2">
      <span>{device.display}</span>
      <span>{device.category}</span>
    </div>
  );
}

import { useId } from "react";
import type { Device } from "@/devices/catalog";

/** SDK artwork is keyed against white, just like its simulator window. */
export function DeviceFrame({ device }: { device: Device }) {
  const key = useId();
  const bezel = useId();
  const frame = device.frame;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <defs>
        <clipPath id={bezel}>
          <circle
            cx={device.width / 2}
            cy={device.height / 2}
            r={frame.bezelRadius}
          />
        </clipPath>
        <filter id={key} colorInterpolationFilters="sRGB">
          {/* Preserve RGB; only the near-white matte becomes transparent. */}
          <feColorMatrix
            result="matte"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -85 -85 -85 0 255"
          />
          <feMorphology
            in="matte"
            operator="erode"
            radius="1.5"
            result="cleanMatte"
          />
          <feComposite in="SourceGraphic" in2="cleanMatte" operator="in" />
        </filter>
      </defs>
      <image
        href={frame.image}
        x={-frame.screenX}
        y={-frame.screenY}
        width={frame.width}
        height={frame.height}
        filter={`url(#${key})`}
      />
      {/* Keep white bezel markings intact; matte removal is only for the outer silhouette. */}
      <image
        href={frame.image}
        x={-frame.screenX}
        y={-frame.screenY}
        width={frame.width}
        height={frame.height}
        clipPath={`url(#${bezel})`}
      />
    </g>
  );
}

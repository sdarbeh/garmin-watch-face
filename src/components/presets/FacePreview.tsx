"use client";
import { getDeviceById } from "@/devices/catalog";
import { useId } from "react";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
import type { Design } from "@/watchface/schema";
import { VisualLayer } from "@/components/editor/canvas/VisualLayer";
export function FacePreview({
  design,
  samples = SAMPLE_DATA,
}: {
  design: Design;
  samples?: typeof SAMPLE_DATA;
}) {
  const clip = useId();
  const { width, height } = getDeviceById(design.device)!;
  return (
    <svg
      className="studio-face-preview"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${design.name} preview with sample data`}
    >
      <defs>
        <clipPath id={clip}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={Math.min(width, height) / 2}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={width} height={height} fill={design.background} />
        {renderModel(design, samples).map((e) => (
          <VisualLayer key={e.id} element={e} />
        ))}
      </g>
    </svg>
  );
}

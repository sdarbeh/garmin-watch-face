"use client";
import Link from "next/link";
import type { Preset } from "@/presets/catalog";
import { getDeviceById } from "@/devices/catalog";
import { useLibrary } from "@/library/useLibrary";
import { ArrowRightIcon } from "@/icons";
import { FacePreview } from "./FacePreview";
export function PresetCard({
  preset,
  headingLevel = 3,
}: {
  preset: Preset;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const library = useLibrary();
  const selectedWatch = library.selectedWatch;
  const compatibility = selectedWatch
    ? `${preset.compatibleDevices.includes(selectedWatch) ? "Compatible with" : "Not compatible with"} ${getDeviceById(selectedWatch)?.name}`
    : preset.compatibleDevices.map((id) => getDeviceById(id)?.name).join(", ");
  return (
    <Link
      href={`/presets/${preset.slug}`}
      className="studio-preset"
      aria-label={`Preview ${preset.name}`}
    >
      <span className="studio-preset__arrow" aria-hidden="true">
        <ArrowRightIcon size="sm" />
      </span>
      <FacePreview design={preset.design} />
      <Heading className="u-font-md u-weight-semibold mt3">
        {preset.name}
      </Heading>
      <p className="u-font-xs u-text-secondary mt1">{compatibility}</p>
    </Link>
  );
}

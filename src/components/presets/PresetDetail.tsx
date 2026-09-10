"use client";
import { useState, useMemo } from "react";
import { designForDevice } from "@/watchface/schema";
import Image from "next/image";
import { presets, type Preset } from "@/presets/catalog";
import { getDeviceById } from "@/devices/catalog";
import { StartDesignButton } from "@/components/library/StartDesignButton";
import { FacePreview } from "./FacePreview";
import { PresetCard } from "./PresetCard";
import { useWatchfaceBuild } from "@/components/editor/hooks/useWatchfaceBuild";
import { ExportWalkthrough } from "@/components/editor/export/ExportWalkthrough";
import { WatchPickerModal } from "@/components/devices/WatchPickerModal";
import { useLibrary } from "@/library/useLibrary";
import { browserLibrary } from "@/library/store";
import { Button } from "@/components/ui";
import { ArrowRightIcon, ChevronLeftIcon, CheckCircleIcon } from "@/icons";
import { powerLayout, type PowerMode } from "@/watchface/power";
import { METRICS } from "@/watchface/layer-catalog";

const modeLabels = {
  normal: "Normal",
  night: "Night",
  "always-on": "Always-on",
  "low-battery": "Low battery",
} as const;
const layerLabels: Record<string, string> = {
  time: "Time",
  date: "Date",
  ...Object.fromEntries(
    Object.entries(METRICS).map(([key, value]) => [key, value.label]),
  ),
  progress: "Progress rings",
  image: "Background image",
  shape: "Shapes",
  text: "Text",
  icon: "Icons",
};
export function PresetDetail({ preset }: { preset: Preset }) {
  const { selectedWatch } = useLibrary();
  const watch = selectedWatch ? getDeviceById(selectedWatch) : undefined;
  const compatible = watch && preset.compatibleDevices.includes(watch.id);
  const [choosing, setChoosing] = useState(false);
  const [mode, setMode] = useState<PowerMode>("normal");
  const [message, setMessage] = useState("");
  const design = useMemo(
    () =>
      designForDevice(
        preset.design,
        compatible ? watch.id : preset.design.device,
      ),
    [preset.design, compatible, watch],
  );
  const controller = useWatchfaceBuild(design, setMessage);
  const visibleTypes = new Set(
    preset.design.elements.filter((e) => e.visible).map((e) => e.type),
  );
  const includes = Object.entries(layerLabels)
    .filter(([type]) =>
      visibleTypes.has(type as (typeof preset.design.elements)[number]["type"]),
    )
    .map(([, label]) => label);
  const related = presets
    .filter(
      (p) =>
        p.slug !== preset.slug &&
        p.compatibleDevices.some((id) => preset.compatibleDevices.includes(id)),
    )
    .slice(0, 4);
  return (
    <section className="studio-page u-grid gap5">
      <div>
        <Button
          href="/presets"
          variant="ghost"
          size="sm"
          className="studio-text-link"
        >
          <ChevronLeftIcon size="sm" />
          Presets
        </Button>
      </div>
      <div className="preset-detail">
        <div className="preset-detail__stage">
          <FacePreview design={powerLayout(design, mode)} />
          <div
            className="preset-detail__modes"
            role="group"
            aria-label="Preview display mode"
          >
            {(Object.keys(modeLabels) as PowerMode[])
              .filter(
                (value) => value !== "night" || preset.design.night?.enabled,
              )
              .map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  active={mode === value}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {modeLabels[value]}
                </Button>
              ))}
          </div>
        </div>
        <div className="preset-detail__info">
          <div className="u-grid gap3">
            <h1 className="preset-detail__title">{preset.name}</h1>
            <p className="u-font-lg u-text-secondary">{preset.description}</p>
            <p className="u-font-sm u-text-secondary">
              {[
                ...new Set(
                  preset.compatibleDevices.map(
                    (id) => getDeviceById(id)?.display,
                  ),
                ),
              ].join(" · ")}{" "}
              · Round displays
            </p>
          </div>
          <hr className="preset-detail__divider" />
          <div className="u-grid gap3">
            <h2 className="u-font-lg u-weight-semibold">Includes</h2>
            <p className="u-font-sm u-text-secondary">{includes.join(" · ")}</p>
          </div>
          <hr className="preset-detail__divider" />
          <h2 className="u-font-lg u-weight-semibold">Selected watch</h2>
          {watch ? (
            <div className="preset-detail__watch">
              <Image
                src={watch.preview}
                alt={watch.name}
                width={100}
                height={100}
                className="preset-detail__watch-image"
              />
              <div className="u-grid gap2">
                <h3 className="u-font-lg u-weight-semibold">{watch.name}</h3>
                <p className="u-font-sm u-text-secondary">
                  {watch.width} × {watch.height} · {watch.display}
                </p>
                <p className="preset-detail__compatibility">
                  {compatible && <CheckCircleIcon size="sm" />}
                  {compatible ? "Compatible" : "Choose a compatible watch"}
                </p>
              </div>
            </div>
          ) : (
            <p className="u-font-sm u-text-secondary">
              Choose your Garmin to start customizing this face.
            </p>
          )}
          <div className="preset-detail__actions">
            {compatible ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setChoosing(true)}
                >
                  Change watch
                </Button>
                <StartDesignButton
                  presetSlug={preset.slug}
                  watchId={watch.id}
                  variant="primary"
                >
                  Customize for {watch.name}
                </StartDesignButton>
              </>
            ) : (
              <Button variant="primary" onClick={() => setChoosing(true)}>
                Choose your watch
              </Button>
            )}
          </div>
          <details className="preset-detail__download">
            <summary>Download preset</summary>
            <div className="u-grid gap4 mt4">
              {message && <p role="status">{message}</p>}
              <ExportWalkthrough
                onDownloaded={() =>
                  browserLibrary.recordDownload(design, {
                    presetSlug: preset.slug,
                  })
                }
                controller={controller}
                design={design}
                ready
              />
            </div>
          </details>
        </div>
      </div>
      <section className="studio-home__section">
        <div className="studio-section-heading">
          <h2 className="u-font-xl u-weight-semibold">More like this</h2>
          <Button
            href="/presets"
            size="sm"
            variant="ghost"
            className="studio-text-link"
          >
            View all <ArrowRightIcon size="sm" />
          </Button>
        </div>
        <div className="preset-detail__related">
          {related.map((p) => (
            <PresetCard key={p.slug} preset={p} />
          ))}
        </div>
      </section>
      {choosing && (
        <WatchPickerModal
          preset={preset}
          onClose={() => setChoosing(false)}
          onSelect={(device) => {
            browserLibrary.selectWatch(device.id);
            setChoosing(false);
          }}
        />
      )}
    </section>
  );
}

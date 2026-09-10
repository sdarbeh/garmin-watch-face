"use client";
import { DesignDates } from "@/components/library/DesignDates";
import { featuredPresets } from "@/presets/catalog";
import { devices } from "@/devices/catalog";
import { useLibrary } from "@/library/useLibrary";
import { Button } from "@/components/ui";
import { PresetCard } from "@/components/presets/PresetCard";
import { StartDesignButton } from "@/components/library/StartDesignButton";
import Link from "next/link";
import { WatchPreview } from "@/components/editor/canvas/WatchPreview";
import { ArrowRightIcon } from "@/icons";
import { getDeviceById } from "@/devices/catalog";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { HeroWatch } from "./HeroWatch";
export function HomeLauncher() {
  const library = useLibrary();
  const recent = [...library.projects]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  return (
    <div className="studio-page studio-home">
      <section className="studio-hero">
        <div className="studio-hero__copy">
          <h1 className="studio-hero__title">
            Make your
            <br />
            watch yours.
          </h1>
          <p className="studio-hero__description">
            Start with a preset or create a face from scratch.
          </p>
          <div className="u-flex u-flex-wrap gap2">
            <StartDesignButton variant="primary" />
            <Button
              href="/presets"
              size="sm"
              variant="ghost"
              className="studio-text-link"
            >
              Browse presets <ArrowRightIcon size="sm" />
            </Button>
          </div>
        </div>
        <div className="studio-hero__preview">
          <HeroWatch />
        </div>
      </section>
      {library.error && <p role="alert">{library.error}</p>}
      {recent.length > 0 && (
        <section className="studio-home__section">
          <div className="studio-section-heading">
            <h2 className="u-font-xl u-weight-semibold">Continue designing</h2>
            <Button href="/designs" size="sm" variant="ghost">
              My designs <ArrowRightIcon size="sm" />
            </Button>
          </div>
          <div className="studio-recent-grid">
            {recent.map((project) => (
              <Link
                key={project.id}
                href={`/editor/${project.id}`}
                className="studio-recent"
              >
                <WatchPreview design={project.design} selected={null} />
                <div className="u-grid gap1">
                  <span className="u-font-md u-weight-semibold">
                    {project.design.name}
                  </span>
                  <span className="u-font-xs u-text-secondary">
                    {getDeviceById(project.design.device)?.name} ·{" "}
                    <DesignDates project={project} />
                  </span>
                </div>
                <span className="studio-recent__action" aria-hidden="true">
                  <span className="studio-recent__action-label">Continue</span>
                  <ArrowRightIcon size="sm" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="studio-home__section">
        <div className="studio-section-heading">
          <h2 className="u-font-xl u-weight-semibold">Presets</h2>
          <Button href="/presets" size="sm" variant="ghost">
            View all <ArrowRightIcon size="sm" />
          </Button>
        </div>
        <div className="studio-preset-row">
          {featuredPresets.map((preset) => (
            <PresetCard key={preset.slug} preset={preset} />
          ))}
        </div>
      </section>
      <section className="studio-home__section">
        <div className="studio-section-heading">
          <h2 className="u-font-xl u-weight-semibold">Choose a watch</h2>
          <Button href="/watches" size="sm" variant="ghost">
            View all <ArrowRightIcon size="sm" />
          </Button>
        </div>
        <div className="studio-watch-grid">
          {devices
            .filter((d) => d.supported)
            .slice(0, 4)
            .map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
        </div>
      </section>
    </div>
  );
}

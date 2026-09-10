"use client";
import Link from "next/link";
import type { SavedDesign } from "@/library/store";
import { getDeviceById } from "@/devices/catalog";
import { WatchPreview } from "@/components/editor/canvas/WatchPreview";
import { ArrowRightIcon } from "@/icons";
import { DesignDates } from "./DesignDates";
import { DesignCardMenu } from "./DesignCardMenu";
export function DesignCard({
  project,
  onRemove,
}: {
  project: SavedDesign;
  onRemove: (project: SavedDesign) => void;
}) {
  const href = `/editor/${project.id}`;
  return (
    <article className="design-card">
      <div className="design-card__preview">
        <Link
          href={href}
          aria-label={`Open ${project.design.name}`}
          className="design-card__face"
        >
          <WatchPreview design={project.design} selected={null} />
          <span className="design-card__continue ui-button ui-button--primary ui-button--sm">
            Continue <ArrowRightIcon size="sm" />
          </span>
        </Link>
        <DesignCardMenu
          name={project.design.name}
          href={href}
          onDelete={() => onRemove(project)}
        />
      </div>
      <h2 className="u-font-md u-weight-semibold mt3">
        <Link href={href}>{project.design.name}</Link>
      </h2>
      <p className="u-font-xs u-text-secondary mt1">
        {getDeviceById(project.design.device)?.name} ·{" "}
        <DesignDates project={project} />
      </p>
    </article>
  );
}

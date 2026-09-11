import Image from "next/image";
import { ChevronLeftIcon, EditIcon } from "@/icons";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { Design } from "@/watchface/schema";
import { getDeviceById } from "@/devices/catalog";
import type { DesignIssue } from "@/watchface/design-validation";

function buildStatus(issues: DesignIssue[]) {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;

  if (errors > 0) {
    return {
      state: "error" as const,
      label: `${errors} ${errors === 1 ? "error" : "errors"} · Build blocked`,
    };
  }
  if (warnings > 0) {
    return {
      state: "warning" as const,
      label: `Ready with ${warnings} ${warnings === 1 ? "warning" : "warnings"}`,
    };
  }
  return { state: "ready" as const, label: "Ready to build" };
}

export function EditorToolbar({
  design,
  ready,
  saved,
  canBuild,
  issues,
  setDesign,
  preview,
  validationOpen,
  onPreview,
  onValidation,
  onExport,
}: {
  design: Design;
  ready: boolean;
  saved: string;
  canBuild: boolean;
  issues: DesignIssue[];
  setDesign: (design: Design) => void;
  preview: boolean;
  validationOpen: boolean;
  onPreview: () => void;
  onValidation: () => void;
  onExport: () => void;
}) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const device = getDeviceById(design.device)!;
  const projectName = nameDraft ?? design.name;
  const status =
    nameDraft !== null
      ? { state: "error" as const, label: "Invalid name · Build blocked" }
      : buildStatus(issues);
  const buildEnabled = canBuild && nameDraft === null;
  return (
    <header className="watchface-toolbar">
      <div className="watchface-toolbar__identity">
        <Button variant="ghost" href="/designs" className="watchface-back">
          <ChevronLeftIcon size="sm" strokeWidth="1.5" />
          <span className="watchface-back__label">My designs</span>
        </Button>
        <span className="watchface-toolbar__divider" aria-hidden="true" />
        <label className="watchface-project-name">
          <span className="u-sr-only">Project name</span>
          <input
            disabled={!ready}
            value={projectName}
            size={Math.min(40, Math.max(4, projectName.length + 1))}
            maxLength={40}
            aria-invalid={nameDraft !== null}
            aria-describedby={
              nameDraft !== null ? "project-name-help" : undefined
            }
            onBlur={() => setNameDraft(null)}
            onChange={(event) => {
              const name = event.target.value;
              if (/^[A-Za-z0-9][A-Za-z0-9 _-]{0,39}$/.test(name)) {
                setNameDraft(null);
                setDesign({ ...design, name });
              } else setNameDraft(name);
            }}
          />
          <EditIcon size="sm" />
          {nameDraft !== null && (
            <span id="project-name-help" className="watchface-name-help">
              Start with a letter or number. Use letters, numbers, spaces,
              hyphens or underscores.
            </span>
          )}
        </label>
      </div>
      <div className="watchface-toolbar__context">
        <div className="watchface-toolbar__device" title="Design target">
          <Image src={device.preview} alt="" width={28} height={28} />
          <span>{device.name}</span>
        </div>
        <span className="watchface-save-status" role="status">
          {saved}
        </span>
      </div>
      <div className="watchface-toolbar__actions">
        <div className="watchface-toolbar__buttons">
          <Button
            size="sm"
            variant="ghost"
            active={preview}
            aria-pressed={preview}
            onClick={onPreview}
          >
            {preview ? "Back to editor" : "Preview"}
          </Button>
          <Button
            variant="primary"
            disabled={!buildEnabled}
            aria-describedby="watchface-build-status"
            onClick={onExport}
          >
            Build
          </Button>
        </div>
        <button
          type="button"
          id="watchface-build-status"
          className="watchface-build-status"
          data-status={status.state}
          aria-haspopup="dialog"
          aria-expanded={validationOpen}
          aria-label={`${status.label}. View design checks.`}
          disabled={issues.length === 0}
          onClick={onValidation}
        >
          <span className="u-icon-xxs" aria-hidden="true" />
          {status.label}
        </button>
      </div>
    </header>
  );
}

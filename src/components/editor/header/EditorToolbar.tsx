import Image from "next/image";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  DownloadIcon,
  EditIcon,
  WarningIcon,
} from "@/icons";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { Design } from "@/watchface/schema";
import { getDeviceById } from "@/devices/catalog";
import type { DesignIssue } from "@/watchface/design-validation";
import type { LocalSaveStatus } from "@/library/store";
import type { WatchfaceBuildStatus } from "@/components/editor/hooks/useWatchfaceBuild";
import { EditorStatusNotch, saveBlocksBuild } from "./EditorStatusNotch";

function BuildButtonContent({ status }: { status: WatchfaceBuildStatus }) {
  switch (status) {
    case "building":
      return (
        <>
          <span
            className="watchface-build-button__spinner u-spin"
            aria-hidden="true"
          />
          <span className="u-sr-only">Building watch file</span>
        </>
      );
    case "success":
      return (
        <>
          <CheckCircleIcon size="sm" />
          <span className="u-sr-only">Watch file built</span>
        </>
      );
    case "failure":
      return (
        <>
          <WarningIcon size="sm" />
          <span className="u-sr-only">Build failed. Try again</span>
        </>
      );
    case "idle":
      return (
        <>
          <DownloadIcon size="sm" />
          <span className="u-sr-only">Build and download</span>
        </>
      );
  }
}

export function EditorToolbar({
  design,
  ready,
  saveStatus,
  canBuild,
  buildState,
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
  saveStatus: LocalSaveStatus;
  canBuild: boolean;
  buildState: WatchfaceBuildStatus;
  issues: DesignIssue[];
  setDesign: (design: Design) => void;
  preview: boolean;
  validationOpen: boolean;
  onPreview: () => void;
  onValidation: () => void;
  onExport: () => void;
}) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const nameAtFocus = useRef(design.name);
  const device = getDeviceById(design.device)!;
  const projectName = nameDraft ?? design.name;
  const buildEnabled =
    canBuild &&
    nameDraft === null &&
    buildState !== "building" &&
    !saveBlocksBuild(saveStatus);
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
            onFocus={() => {
              nameAtFocus.current = design.name;
            }}
            onBlur={() => setNameDraft(null)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                if (design.name !== nameAtFocus.current) {
                  setDesign({ ...design, name: nameAtFocus.current });
                }
                setNameDraft(null);
                event.currentTarget.blur();
              }
            }}
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
        <div className="watchface-toolbar__device">
          <Image src={device.preview} alt="" width={28} height={28} />
          <span>{device.name}</span>
          <span className="u-text-secondary u-weight-regular u-font-xs">
            ({device.width} × {device.height})
          </span>
        </div>
      </div>
      <div className="watchface-toolbar__actions">
        <div className="watchface-toolbar__buttons">
          <Button
            className="watchface-toolbar__preview"
            size="sm"
            variant="ghost"
            active={preview}
            aria-pressed={preview}
            aria-keyshortcuts={preview ? "Escape" : undefined}
            title={preview ? "Back to editor (Esc)" : "Preview"}
            onClick={onPreview}
          >
            {preview ? "Back to editor" : "Preview"}
          </Button>
          <Button
            variant="primary"
            className="watchface-build-button"
            iconOnly
            disabled={!buildEnabled}
            aria-busy={buildState === "building"}
            aria-keyshortcuts="Meta+Enter Control+Enter"
            title="Build and download (⌘/Ctrl + Enter)"
            onClick={onExport}
          >
            <span className="watchface-build-button__label" aria-live="polite">
              <BuildButtonContent status={buildState} />
            </span>
          </Button>
        </div>
        <EditorStatusNotch
          {...{ saveStatus, issues, validationOpen, onValidation }}
          invalidName={nameDraft !== null}
        />
      </div>
    </header>
  );
}

import { downloadFilename } from "@/watchface/download-filename";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { Button, WorkflowSteps } from "@/components/ui";
import type { Design } from "@/watchface/schema";
import type { useWatchfaceBuild } from "../hooks/useWatchfaceBuild";
import { ExportPreviews } from "./ExportPreviews";
import { InstallationGuide } from "./InstallationGuide";

import {
  ComputerSelection,
  detectExportPlatform,
  type ExportPlatform,
} from "./ComputerSelection";

const subscribeToPlatform = () => () => {};
const serverPlatform = () => null;

export function ExportWalkthrough({
  design,
  ready,
  controller,
  onClose,
  active = true,
  onDownloaded,
  message = "",
}: {
  design: Design;
  ready: boolean;
  controller: ReturnType<typeof useWatchfaceBuild>;
  onClose?: () => void;
  active?: boolean;
  onDownloaded: () => void;
  message?: string;
}) {
  const operation = useRef<AbortController | null>(null);
  // Closing the modal stops polling/downloads; the server can finish its queued build.
  useEffect(() => () => operation.current?.abort(), [active]);
  const [downloadedBuildId, setDownloadedBuildId] = useState<string | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [requestedStep, setStep] = useState(0);
  const detectedPlatform = useSyncExternalStore(
    subscribeToPlatform,
    detectExportPlatform,
    serverPlatform,
  );
  const [chosenPlatform, setPlatform] = useState<ExportPlatform | null>(null);
  const platform = chosenPlatform ?? detectedPlatform;
  const currentBuild =
    controller.build?.state === "success" && !controller.stale;
  const step = currentBuild ? requestedStep : 0;
  const busy = controller.busy || downloading;
  let continueLabel = step === 0 ? "Continue" : "I’ve copied the file";
  if (busy) continueLabel = "Building…";
  const heading = useRef<HTMLDivElement>(null);
  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function buildAndDownload(reuse = false) {
    if (!active || operation.current) return;
    const abort = new AbortController();
    operation.current = abort;
    setDownloadError("");
    try {
      const result =
        reuse && currentBuild
          ? controller.build
          : await controller.startBuild(abort.signal);
      if (!result) return;
      abort.signal.throwIfAborted();
      setDownloading(true);
      const response = await fetch(`/api/builds/${result.id}/download`, {
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30000)]),
      });
      if (!response.ok)
        throw new Error("The file couldn’t be downloaded. Please try again.");
      const blob = await response.blob();
      abort.signal.throwIfAborted();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? downloadFilename(design);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      onDownloaded();
      setDownloadedBuildId(result.id);
      goToStep(1);
    } catch {
      if (!abort.signal.aborted)
        setDownloadError(
          "The file couldn’t be downloaded. Select Continue to try again.",
        );
    } finally {
      operation.current = null;
      setDownloading(false);
    }
  }
  return (
    <div className="watchface-export__walkthrough">
      <ExportPreviews design={design} />
      <WorkflowSteps
        steps={["Computer", "Transfer", "Apply"]}
        current={step + 1}
        ariaLabel="Installation progress"
        size="sm"
      />
      <div
        ref={heading}
        tabIndex={-1}
        className="watchface-export__content"
        aria-label={`Step ${step + 1} of 3`}
      >
        {message && (
          <p className="ui-notice u-font-sm mb3" role="status">
            {message}
          </p>
        )}
        {step === 0 && (
          <ComputerSelection
            platform={platform}
            onChange={setPlatform}
            disabled={busy}
          />
        )}
        {downloadError && (
          <p className="ui-notice u-font-sm mt3" role="alert">
            {downloadError}
          </p>
        )}
        {step >= 1 && platform && (
          <>
            <InstallationGuide
              step={step === 1 ? "transfer" : "apply"}
              platform={platform}
            />
            {step === 1 && (
              <p className="u-font-sm u-text-secondary mt4">
                Your download has started. If it didn’t appear,{" "}
                <a
                  href={`/api/builds/${controller.build!.id}/download`}
                  download
                  onClick={(event) => {
                    event.preventDefault();
                    void buildAndDownload(true);
                  }}
                >
                  download the watch file again
                </a>
                .
              </p>
            )}
          </>
        )}
      </div>
      <footer className="watchface-export__navigation">
        <Button
          variant="ghost"
          disabled={step === 0 || busy}
          onClick={() => goToStep(step - 1)}
        >
          <ChevronLeftIcon />
          Back
        </Button>
        <div className="u-flex u-flex-wrap u-items-center gap2">
          {step === 0 &&
            currentBuild &&
            downloadedBuildId === controller.build?.id && (
              <Button
                variant="ghost"
                disabled={!ready || busy || !platform}
                onClick={() => goToStep(1)}
              >
                Already downloaded
              </Button>
            )}
          {step < 2 ? (
            <Button
              variant="primary"
              aria-busy={busy}
              aria-live="polite"
              disabled={
                !ready || busy || (step === 0 ? !platform : !currentBuild)
              }
              onClick={() =>
                step === 0 ? void buildAndDownload() : goToStep(2)
              }
            >
              {continueLabel}
              <ChevronRightIcon />
            </Button>
          ) : (
            <Button variant="primary" onClick={onClose ?? (() => goToStep(0))}>
              {onClose ? "Done" : "Start again"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

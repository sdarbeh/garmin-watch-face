import type { DesignIssue } from "@/watchface/design-validation";
import type { LocalSaveStatus } from "@/library/store";
import { LoadingIcon, WarningIcon } from "@/icons";
import { cx } from "@/utils/css";
import { useEffect, useState } from "react";

const READY_VISIBLE_MS = 2_000;
const STATUS_EXIT_MS = 260;

const SAVE_BLOCKING_STATES = new Set<LocalSaveStatus["state"]>([
  "loading",
  "pending",
  "error",
]);

type NotchStatus = {
  state: "loading" | "pending" | "ready" | "warning" | "error";
  label: string;
};

export function saveBlocksBuild(status: LocalSaveStatus) {
  return SAVE_BLOCKING_STATES.has(status.state);
}

function buildStatus(issues: DesignIssue[]): NotchStatus {
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

function getSaveStatus(status: LocalSaveStatus): NotchStatus | null {
  switch (status.state) {
    case "loading":
      return { state: "loading" as const, label: "Loading locally…" };
    case "pending":
      return { state: "pending" as const, label: "Saving locally…" };
    case "error":
      return { state: "error" as const, label: "Couldn’t save locally" };
    case "saved":
    case "unsaved":
      return null;
  }
}

function StatusIcon({ state }: { state: string }) {
  if (state === "loading" || state === "pending")
    return <LoadingIcon className="u-spin" size="xxs" />;
  if (state === "error") return <WarningIcon size="xxs" />;
  return <span className="watchface-editor-status__dot" />;
}

export function EditorStatusNotch({
  saveStatus,
  issues,
  invalidName,
  validationOpen,
  onValidation,
}: {
  saveStatus: LocalSaveStatus;
  issues: DesignIssue[];
  invalidName: boolean;
  validationOpen: boolean;
  onValidation: () => void;
}) {
  const [hiddenReadyRevision, setHiddenReadyRevision] = useState<number | null>(
    null,
  );
  const [closingReadyRevision, setClosingReadyRevision] = useState<
    number | null
  >(null);
  const saveBlocked = saveBlocksBuild(saveStatus);
  let status: NotchStatus | null = saveBlocked
    ? getSaveStatus(saveStatus)
    : null;
  if (!status) {
    status = invalidName
      ? { state: "error" as const, label: "Invalid name · Build blocked" }
      : buildStatus(issues);
  }
  const canOpenValidation =
    !saveBlocked && !invalidName && issues.length > 0;

  useEffect(() => {
    if (status.state !== "ready") return;
    const closeTimer = window.setTimeout(
      () => setClosingReadyRevision(saveStatus.revision),
      READY_VISIBLE_MS,
    );
    const hideTimer = window.setTimeout(
      () => setHiddenReadyRevision(saveStatus.revision),
      READY_VISIBLE_MS + STATUS_EXIT_MS,
    );
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [saveStatus.revision, status.state]);

  if (
    status.state === "ready" &&
    hiddenReadyRevision === saveStatus.revision
  )
    return null;

  const isClosing =
    status.state === "ready" &&
    closingReadyRevision === saveStatus.revision;
  const motionClassName = isClosing
    ? "u-collapse-to-top"
    : "u-slide-in-from-right";

  return (
    <button
      type="button"
      id="watchface-build-status"
      className={cx("watchface-editor-status", motionClassName)}
      data-status={status.state}
      data-closing={isClosing || undefined}
      aria-haspopup={canOpenValidation ? "dialog" : undefined}
      aria-expanded={canOpenValidation ? validationOpen : undefined}
      aria-label={
        canOpenValidation
          ? `${status.label}. View design checks.`
          : status.label
      }
      disabled={!canOpenValidation}
      onClick={onValidation}
    >
      <span
        className="watchface-editor-status__icon u-icon-xxs"
        aria-hidden="true"
      >
        <StatusIcon state={status.state} />
      </span>
      <span
        className="watchface-editor-status__label"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status.label}
      </span>
    </button>
  );
}

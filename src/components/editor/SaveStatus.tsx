import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  EditIcon,
  LoadingIcon,
  WarningIcon,
} from "@/icons";
import type { LocalSaveState, LocalSaveStatus } from "@/library/store";

const HIDE_DELAY_MS = 2_000;
const SAVE_STATUS_LABELS: Record<LocalSaveState, string> = {
  error: "Couldn’t save locally",
  loading: "Loading locally…",
  pending: "Saving locally…",
  saved: "Saved locally",
  unsaved: "Not saved yet",
};

function StatusIcon({ state }: { state: LocalSaveState }) {
  switch (state) {
    case "loading":
    case "pending":
      return <LoadingIcon className="u-spin" size="sm" />;
    case "saved":
      return <CheckCircleIcon size="sm" />;
    case "error":
      return <WarningIcon size="sm" />;
    case "unsaved":
      return <EditIcon size="sm" />;
  }
}

function SaveStatusMessage({ status }: { status: LocalSaveStatus }) {
  const [visible, setVisible] = useState(true);
  const label = SAVE_STATUS_LABELS[status.state];

  useEffect(() => {
    if (["error", "loading", "pending"].includes(status.state)) return;
    const timer = window.setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status.state]);

  return (
    <span
      className="watchface-save-status"
      data-state={status.state}
      data-visible={visible}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-hidden={!visible}
      title={label}
    >
      <span className="watchface-save-status__icon" aria-hidden="true">
        <StatusIcon state={status.state} />
      </span>
      <span className="watchface-save-status__label">{label}</span>
    </span>
  );
}

export function SaveStatus({ status }: { status: LocalSaveStatus }) {
  return (
    <SaveStatusMessage
      key={`${status.state}-${status.revision}`}
      status={status}
    />
  );
}

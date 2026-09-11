import { useId, useMemo, useState, type ReactNode } from "react";
import { Button, Dialog, Drawer } from "@/components/ui";
import { getDeviceById } from "@/devices/catalog";
import { ChevronRightIcon } from "@/icons";
import { supportsMode } from "@/watchface/capabilities";
import type { DesignIssue } from "@/watchface/design-validation";
import { powerLayout } from "@/watchface/power";
import type { Design } from "@/watchface/schema";
import {
  layerLabel,
  type EditorSelection,
} from "@/components/editor/types";
import {
  EDITOR_MODE_LABELS,
  EDITOR_MODE_OPTIONS,
} from "@/components/editor/model/display-modes";
import type { DisplayMode } from "@/components/editor/model/simulation";
import { ValidationIssueButton } from "./ValidationIssueButton";

function ValidationIssueGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const headingId = useId();

  return (
    <section className="watchface-validation-dialog__group" data-open={open}>
      <Button
        id={headingId}
        variant="ghost"
        size="sm"
        className="watchface-validation-dialog__group-summary"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          {label} <span>{count}</span>
        </span>
        <ChevronRightIcon size="sm" />
      </Button>
      <Drawer open={open} labelledBy={headingId}>
        <div className="watchface-validation-dialog__list">{children}</div>
      </Drawer>
    </section>
  );
}

export function DesignValidationDialog({
  open,
  design,
  issues,
  activeMode,
  onClose,
  onModeChange,
  onNavigate,
}: {
  open: boolean;
  design: Design;
  issues: DesignIssue[];
  activeMode: DisplayMode;
  onClose: () => void;
  onModeChange: (mode: DisplayMode) => void;
  onNavigate: (mode: DisplayMode, selection: EditorSelection) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const device = getDeviceById(design.device)!;
  const modes = useMemo(
    () => EDITOR_MODE_OPTIONS.filter(({ id }) => supportsMode(device, id)),
    [device],
  );
  const layouts = useMemo(
    () =>
      new Map(modes.map(({ id }) => [id, powerLayout(design, id)] as const)),
    [design, modes],
  );

  const modeIssues = issues.filter(
    (issue) => !issue.mode || issue.mode === activeMode,
  );
  const errors = modeIssues.filter((issue) => issue.severity === "error");
  const warnings = modeIssues.filter((issue) => issue.severity === "warning");
  const modeLabel = EDITOR_MODE_LABELS[activeMode];

  function navigate(issue: DesignIssue) {
    const mode = issue.mode ?? activeMode;
    const layout = layouts.get(mode) ?? powerLayout(design, mode);
    const selection = layout.elements.some(
      (element) => element.id === issue.elementId,
    )
      ? (issue.elementId as EditorSelection)
      : "background";
    onNavigate(mode, selection);
  }

  function renderIssues(label: string, sectionIssues: DesignIssue[]) {
    if (sectionIssues.length === 0) return null;
    return (
      <ValidationIssueGroup
        key={`${activeMode}:${label}`}
        label={label}
        count={sectionIssues.length}
      >
        {sectionIssues.map((issue) => {
          const layout =
            layouts.get(issue.mode ?? activeMode) ??
            powerLayout(design, issue.mode ?? activeMode);
          const element = issue.elementId
            ? layout.elements.find((item) => item.id === issue.elementId)
            : undefined;
          return (
            <ValidationIssueButton
              key={`${activeMode}:${issue.id}`}
              issue={issue}
              context={element ? layerLabel(element) : undefined}
              onClick={() => navigate(issue)}
            />
          );
        })}
      </ValidationIssueGroup>
    );
  }

  return (
    <Dialog
      open={open}
      onDismiss={onClose}
      className="watchface-validation-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="watchface-validation-dialog__header">
        <div>
          <h2 id={titleId}>Design checks</h2>
          <p id={descriptionId}>
            Review each screen before building your watch face.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </header>
      <div
        className="watchface-validation-dialog__tabs"
        role="tablist"
        aria-label="Watch face screen"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          const tabs = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              '[role="tab"]',
            ),
          );
          const current = tabs.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          if (current < 0) return;
          event.preventDefault();
          let next = event.key === "Home" ? 0 : tabs.length - 1;
          if (event.key === "ArrowLeft")
            next = (current - 1 + tabs.length) % tabs.length;
          if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
          tabs[next].focus();
          tabs[next].click();
        }}
      >
        {modes.map(({ id, label }) => {
          const count = issues.filter(
            (issue) => !issue.mode || issue.mode === id,
          ).length;
          return (
            <Button
              key={id}
              id={`validation-tab-${id}`}
              role="tab"
              size="sm"
              variant="ghost"
              active={activeMode === id}
              aria-selected={activeMode === id}
              aria-controls={`validation-panel-${id}`}
              tabIndex={activeMode === id ? 0 : -1}
              onClick={() => onModeChange(id)}
            >
              {label}
              {count > 0 && (
                <span className="watchface-validation-dialog__count">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
      <div
        id={`validation-panel-${activeMode}`}
        className="watchface-validation-dialog__content"
        role="tabpanel"
        aria-labelledby={`validation-tab-${activeMode}`}
      >
        {modeIssues.length > 0 ? (
          <>
            {renderIssues("Errors", errors)}
            {renderIssues("Warnings", warnings)}
          </>
        ) : (
          <div className="watchface-validation-dialog__empty">
            <p>{modeLabel} is ready to build.</p>
            <span>No errors or warnings found.</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}

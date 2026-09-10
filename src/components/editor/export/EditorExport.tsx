import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import type { Design } from "@/watchface/schema";
import { ExportWalkthrough } from "./ExportWalkthrough";
import type { useWatchfaceBuild } from "../hooks/useWatchfaceBuild";

export function EditorExport({
  open,
  onClose,
  onDownloaded,
  design,
  ready,
  controller,
  message,
}: {
  message: string;
  open: boolean;
  onClose: () => void;
  onDownloaded: () => void;
  design: Design;
  ready: boolean;
  controller: ReturnType<typeof useWatchfaceBuild>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="watchface-export"
      aria-labelledby="export-title"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="u-flex u-items-center u-justify-between gap4">
        <h2 id="export-title" className="u-font-xl u-weight-semibold">
          Install your watch face
        </h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </header>
      <ExportWalkthrough
        active={open}
        onDownloaded={onDownloaded}
        message={message}
        design={design}
        ready={ready}
        controller={controller}
        onClose={onClose}
      />
    </dialog>
  );
}

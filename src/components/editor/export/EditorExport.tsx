import { Button, Dialog } from "@/components/ui";
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
  return (
    <Dialog
      open={open}
      onDismiss={onClose}
      className="watchface-export"
      aria-labelledby="export-title"
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
    </Dialog>
  );
}

import { useId, useState } from "react";
import { Button, Dialog } from "@/components/ui";

export function ResetProject({
  disabled,
  onConfirm,
  onResetBase,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onResetBase: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetKind, setResetKind] = useState<"initial" | "base">("initial");
  const title = useId();
  const description = useId();
  return (
    <div className="watchface-reset-project-actions">
      <Button
        disabled={disabled}
        variant="ghost"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={dialogOpen && resetKind === "initial"}
        onClick={() => {
          setResetKind("initial");
          setDialogOpen(true);
        }}
      >
        Reset to initial design
      </Button>
      <Button
        variant="ghost"
        disabled={disabled}
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={dialogOpen && resetKind === "base"}
        onClick={() => {
          setResetKind("base");
          setDialogOpen(true);
        }}
      >
        Reset to base
      </Button>
      <Dialog
        open={dialogOpen}
        onDismiss={() => setDialogOpen(false)}
        className="watchface-reset-dialog"
        aria-labelledby={title}
        aria-describedby={description}
      >
        <div className="p5">
          <h2 id={title} className="u-font-lg u-weight-semibold mb2">
            {resetKind === "base"
              ? "Reset to base design?"
              : "Reset this project?"}
          </h2>
          <p id={description} className="u-font-sm u-text-secondary mb5">
            {resetKind === "base"
              ? "Discard every layer and start with a blank canvas for this watch. You can undo this after resetting."
              : "Discard every edit and restore the design exactly as it was when this project was created, including all display-mode layouts. You can undo this after resetting."}
          </p>
          <div className="u-flex u-flex-wrap u-justify-end gap2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={disabled}
              onClick={() => {
                if (resetKind === "base") onResetBase();
                else onConfirm();
                setDialogOpen(false);
              }}
            >
              Reset design
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

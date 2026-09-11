import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";

export function ResetProject({
  disabled,
  onConfirm,
  onResetBase,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onResetBase: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
        onClick={() => {
          setResetKind("initial");
          dialog.current?.showModal();
        }}
      >
        Reset to initial design
      </Button>
      <Button
        variant="ghost"
        disabled={disabled}
        size="sm"
        aria-haspopup="dialog"
        onClick={() => {
          setResetKind("base");
          dialog.current?.showModal();
        }}
      >
        Reset to base
      </Button>
      <dialog
        ref={dialog}
        className="watchface-reset-dialog"
        aria-labelledby={title}
        aria-describedby={description}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
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
              onClick={() => dialog.current?.close()}
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
                dialog.current?.close();
              }}
            >
              Reset design
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

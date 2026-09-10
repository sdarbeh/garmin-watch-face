import { useId, useRef } from "react";
import { Button } from "@/components/ui";

export function ResetProject({
  disabled,
  onConfirm,
}: {
  disabled: boolean;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  return (
    <div>
      <Button
        disabled={disabled}
        variant="danger"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        Reset to starter design
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
            Reset this project?
          </h2>
          <p id={description} className="u-font-sm u-text-secondary mb5">
            Replace your design and all display-mode layouts with the starter
            design. You can undo this after resetting.
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
                onConfirm();
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

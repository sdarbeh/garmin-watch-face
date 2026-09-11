"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type PointerEvent,
  type RefObject,
} from "react";
import { cx } from "@/utils/css";

type DialogProps = Omit<
  ComponentPropsWithoutRef<"dialog">,
  "onCancel" | "onClose" | "onPointerDown" | "onPointerUp" | "open"
> & {
  open: boolean;
  onDismiss: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/** Modal shell with consistent lifecycle, backdrop dismissal, and focus return. */
export function Dialog({
  open,
  onDismiss,
  initialFocusRef,
  className,
  children,
  ...props
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) {
      if (dialog?.open) dialog.close();
      return;
    }

    const activeElement = document.activeElement;
    triggerRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;
    if (!dialog.open) dialog.showModal();
    initialFocusRef?.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      if (triggerRef.current?.isConnected)
        triggerRef.current.focus({ preventScroll: true });
    };
  }, [initialFocusRef, open]);

  function isOutside(event: PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }

  return (
    <dialog
      {...props}
      ref={dialogRef}
      className={cx("ui-dialog", className)}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onPointerDown={(event) => {
        pointerStartedOutside.current = isOutside(event);
      }}
      onPointerUp={(event) => {
        if (pointerStartedOutside.current && isOutside(event)) onDismiss();
        pointerStartedOutside.current = false;
      }}
    >
      {children}
    </dialog>
  );
}

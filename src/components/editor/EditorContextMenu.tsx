"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui";
import {
  ArrangeIcon,
  CopyIcon,
  CutIcon,
  DeleteIcon,
  DuplicateIcon,
  LockIcon,
  PasteIcon,
  VisibilityIcon,
} from "@/icons";
import type { Design } from "@/watchface/schema";
import {
  editorContextItems,
  type EditorContextRequest,
} from "./model/context-menu";
import type { EditorAction } from "./model/shortcuts";
import { layerLabel } from "./types";

function ActionIcon({
  action,
  design,
  request,
}: {
  action: EditorAction;
  design: Design;
  request: EditorContextRequest;
}) {
  const element = design.elements.find((item) => item.id === request.target);
  if (action === "copy") return <CopyIcon size="sm" />;
  if (action === "cut") return <CutIcon size="sm" />;
  if (action === "paste") return <PasteIcon size="sm" />;
  if (action === "duplicate") return <DuplicateIcon size="sm" />;
  if (action === "delete") return <DeleteIcon size="sm" />;
  if (action === "bring-forward")
    return <ArrangeIcon placement="forward" size="sm" />;
  if (action === "send-backward")
    return <ArrangeIcon placement="backward" size="sm" />;
  if (action === "bring-front")
    return <ArrangeIcon placement="front" size="sm" />;
  if (action === "send-back") return <ArrangeIcon placement="back" size="sm" />;
  if (action === "toggle-visibility" && element)
    return <VisibilityIcon visible={element.visible} size="sm" />;
  if (action === "toggle-lock" && element)
    return <LockIcon locked={element.locked} size="sm" />;
  return null;
}

export function EditorContextMenu({
  request,
  design,
  canPaste,
  selectedIds,
  onAction,
  onClose,
}: {
  request: EditorContextRequest;
  design: Design;
  canPaste: boolean;
  selectedIds: string[];
  onAction: (
    action: EditorAction,
    target: EditorContextRequest["target"],
    pastePosition?: EditorContextRequest["canvasPosition"],
  ) => void;
  onClose: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const shouldRestoreFocus = useRef(false);
  const element = design.elements.find((item) => item.id === request.target);
  const items = editorContextItems(
    design,
    request.target,
    canPaste,
    selectedIds,
  );

  useLayoutEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    return () => {
      if (shouldRestoreFocus.current) returnFocus.current?.focus();
    };
  }, []);

  useLayoutEffect(() => {
    const node = menu.current;
    if (!node) return;
    const x = Math.max(
      0,
      Math.min(request.x, window.innerWidth - node.offsetWidth),
    );
    const y = Math.max(
      0,
      Math.min(request.y, window.innerHeight - node.offsetHeight),
    );
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node
      .querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
  }, [request.x, request.y]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [onClose]);

  return (
    <div
      ref={menu}
      className="watchface-context-menu"
      role="menu"
      aria-label={element ? `${layerLabel(element)} actions` : "Canvas actions"}
      style={{ left: request.x, top: request.y }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          shouldRestoreFocus.current = true;
          onClose();
          return;
        }
        const options = Array.from(
          menu.current?.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not(:disabled)',
          ) ?? [],
        );
        if (!options.length) return;
        const current = options.indexOf(document.activeElement as HTMLElement);
        const destinations: Record<string, number> = {
          ArrowDown: (current + 1) % options.length,
          ArrowUp: (current + options.length - 1) % options.length,
          Home: 0,
          End: options.length - 1,
        };
        const next = destinations[event.key];
        if (next === undefined) return;
        event.preventDefault();
        options[next]?.focus();
      }}
    >
      {items.map((item) => (
        <div key={item.action} role="none">
          {item.divider && (
            <div className="watchface-context-menu__divider" role="separator" />
          )}
          <Button
            variant={item.danger ? "danger" : "ghost"}
            size="sm"
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            onClick={() => {
              shouldRestoreFocus.current = true;
              onAction(item.action, request.target, request.canvasPosition);
              onClose();
            }}
          >
            <ActionIcon
              action={item.action}
              design={design}
              request={request}
            />
            <span>{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </Button>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { MoreIcon, ArrowRightIcon, DeleteIcon } from "@/icons";
export function DesignCardMenu({
  name,
  href,
  onDelete,
}: {
  name: string;
  href: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className="design-card__overflow"
      data-open={open || undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        size="sm"
        variant="ghost"
        iconOnly
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <MoreIcon size="sm" />
      </Button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={`${name} actions`}
          className="design-card__menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              trigger.current?.focus();
              return;
            }
            const items = Array.from(
              menu.current?.querySelectorAll<HTMLElement>(
                '[role="menuitem"]',
              ) ?? [],
            );
            const index = items.indexOf(document.activeElement as HTMLElement);
            const next = {
              ArrowDown: (index + 1) % items.length,
              ArrowUp: (index + items.length - 1) % items.length,
              Home: 0,
              End: items.length - 1,
            }[event.key];
            if (next !== undefined) {
              event.preventDefault();
              items[next]?.focus();
            }
          }}
        >
          <Button
            href={href}
            variant="ghost"
            size="sm"
            role="menuitem"
            tabIndex={-1}
          >
            <ArrowRightIcon size="sm" />
            Open
          </Button>
          <Button
            variant="danger"
            size="sm"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <DeleteIcon size="sm" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

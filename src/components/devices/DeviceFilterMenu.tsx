"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FilterIcon } from "@/icons";

export function DeviceFilterMenu({
  families,
  value,
  onChange,
}: {
  families: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const options = [
    { value: "all", label: "All families" },
    ...families.map((family) => ({ value: family, label: family })),
  ];

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      ?.focus();
    function dismiss(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div
      ref={root}
      className="device-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Button
        ref={trigger}
        variant="ghost"
        className="u-radius-small gap2"
        active={open || value !== "all"}
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
        <FilterIcon size="sm" /> Filter{value !== "all" ? " (1)" : ""}
      </Button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Filter by family"
          className="device-filter__menu p2 u-radius-small"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
              return;
            }
            const items = Array.from(
              menu.current?.querySelectorAll<HTMLButtonElement>(
                '[role="menuitemradio"]',
              ) || [],
            );
            const current = items.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            let next = current;
            if (event.key === "ArrowDown") next = (current + 1) % items.length;
            else if (event.key === "ArrowUp")
              next = (current - 1 + items.length) % items.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = items.length - 1;
            else return;
            event.preventDefault();
            items[next]?.focus();
          }}
        >
          <p className="u-font-xs u-text-secondary px3 py2" role="presentation">
            Family
          </p>
          {options.map((option) => (
            <Button
              variant="ghost"
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={value === option.value}
              tabIndex={-1}
              className="device-filter__option u-flex u-items-center u-justify-between gap4 u-w-full u-radius-small px3 py2"
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              {option.label}
              <span aria-hidden="true">
                {value === option.value ? "✓" : ""}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

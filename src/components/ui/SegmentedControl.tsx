"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "@/utils/css";
import { Button } from "./button";

export interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: ReactNode;
  ariaLabel?: string;
}

export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  disabled,
  className,
  onChange,
}: {
  label: string;
  options: readonly SegmentedControlOption<Value>[];
  value: Value;
  disabled?: boolean;
  className?: string;
  onChange: (value: Value) => void;
}) {
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (index - 1 + options.length) % options.length;
        break;
      case "ArrowRight":
        nextIndex = (index + 1) % options.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = options[nextIndex];
    onChange(next.value);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>("[data-segment]")
      [nextIndex]?.focus();
  }

  return (
    <div
      className={cx("ui-segmented-control", className)}
      role="group"
      aria-label={label}
    >
      {options.map((option, index) => (
        <Button
          key={option.value}
          className="ui-segmented-control__option"
          size="sm"
          variant="ghost"
          active={value === option.value}
          aria-label={option.ariaLabel}
          aria-pressed={value === option.value}
          disabled={disabled}
          tabIndex={value === option.value ? 0 : -1}
          data-segment
          onKeyDown={(event) => handleKeyDown(event, index)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

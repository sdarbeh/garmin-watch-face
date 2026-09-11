"use client";

import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "@/utils/css";

export function Switch({
  label,
  checked,
  indeterminate = false,
  className,
  onCheckedChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  label: ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={cx("ui-switch", className)}>
      <span className="ui-switch__label">{label}</span>
      <input
        {...props}
        ref={input}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span className="ui-switch__track" aria-hidden="true">
        <span className="ui-switch__thumb" />
      </span>
    </label>
  );
}

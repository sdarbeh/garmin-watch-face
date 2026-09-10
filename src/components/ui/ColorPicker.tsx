"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";
import { ColorSpectrum } from "./color-picker/ColorSpectrum";
import { hexToHsv, hsvToHex, type HSV } from "./color-picker/color";
import { readRecentColors, rememberColor } from "./color-picker/recent-colors";
import { ColorSwatches } from "./ColorSwatches";

export function ColorPicker({
  value,
  onApply,
  onClose,
}: {
  value: string;
  onApply: (color: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const outsideStart = useRef(false);
  const [recents] = useState(readRecentColors);
  const title = useId();
  const hint = useId();
  const [draft, setDraft] = useState(value);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const normalized = `#${draft.replace(/^#/, "")}`.toUpperCase();
  const valid = /^#[0-9A-F]{6}$/.test(normalized);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function choose(color: string) {
    setHsv(hexToHsv(color));
    setDraft(color.toUpperCase());
  }
  function chooseHsv(next: HSV) {
    setHsv(next);
    setDraft(hsvToHex(next));
  }
  return (
    <dialog
      ref={dialog}
      className="ui-color-picker"
      aria-labelledby={title}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        outsideStart.current =
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom);
      }}
      onPointerUp={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (
          outsideStart.current &&
          event.target === event.currentTarget &&
          outside
        )
          onClose();
        outsideStart.current = false;
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) {
            onApply(normalized);
            rememberColor(normalized);
          }
        }}
      >
        <h2 id={title} className="u-sr-only">
          Choose color
        </h2>
        <ColorSpectrum value={hsv} onChange={chooseHsv} />
        <div className="ui-color-picker__divider" />
        <label className="ui-color-picker__hex ui-field">
          <span className="u-sr-only">Hex color</span>
          <input
            type="text"
            value={draft}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!valid}
            aria-describedby={hint}
            onChange={(event) => {
              const text = event.target.value;
              setDraft(text);
              const hex = `#${text.replace(/^#/, "")}`;
              if (/^#[0-9a-fA-F]{6}$/.test(hex)) setHsv(hexToHsv(hex));
            }}
          />
          <span className="ui-color-picker__hex-label" aria-hidden="true">
            HEX
          </span>
        </label>
        <p
          id={hint}
          className={valid ? "u-sr-only" : "u-font-xs u-text-secondary mb3"}
        >
          {valid
            ? "Enter six hex digits, with or without #."
            : "Use a six-digit hex color, such as #3478F6."}
        </p>
        <section
          className="ui-color-picker__recents"
          aria-label="Recent colors"
        >
          {recents.length > 0 ? (
            <ColorSwatches
              label="Recents"
              colors={recents}
              value={normalized}
              onChange={choose}
            />
          ) : (
            <>
              <h3 className="u-font-xs u-text-secondary mb2">Recents</h3>
              <p className="u-font-xs u-text-secondary">
                Colors you apply will appear here.
              </p>
            </>
          )}
        </section>
        <div className="u-flex u-justify-end gap2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!valid}>
            Apply color
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function ColorField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        className="ui-color-field"
        variant="ghost"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span
          className="ui-color-field__swatch"
          style={{ backgroundColor: value }}
        />
        {value}
      </Button>
      {open && (
        <ColorPicker
          value={value}
          onClose={() => setOpen(false)}
          onApply={(color) => {
            onChange(color);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { devices, type Device } from "@/devices/catalog";
import type { Preset } from "@/presets/catalog";
import { Button } from "@/components/ui";
import { ArrowRightIcon, SearchIcon } from "@/icons";

export function WatchPickerModal({
  preset,
  onSelect,
  onClose,
  selectionAction = "Select",
}: {
  preset?: Preset;
  onSelect: (watch: Device) => void;
  onClose: () => void;
  selectionAction?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const outsideStart = useRef(false);
  const search = useRef<HTMLInputElement>(null);
  const title = useId();
  const hint = useId();
  const [query, setQuery] = useState("");
  const matches = devices.filter(
    (watch) =>
      watch.supported &&
      (!preset || preset.compatibleDevices.includes(watch.id)) &&
      `${watch.name} ${watch.family}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    search.current?.focus();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="studio-dialog watch-picker-modal"
      aria-labelledby={title}
      aria-describedby={hint}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        outsideStart.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (outsideStart.current && event.target === event.currentTarget)
          onClose();
      }}
    >
      <div className="u-flex u-items-center u-justify-between gap3">
        <h2 id={title} className="u-font-xl u-weight-semibold">
          Choose your watch
        </h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <p id={hint} className="u-font-sm u-text-secondary mt2 mb4">
        {preset
          ? `Compatible with ${preset.name}.`
          : "Choose a supported Garmin watch."}{" "}
      </p>
      <label className="ui-search">
        <SearchIcon size="sm" />
        <input
          ref={search}
          type="search"
          aria-label="Search compatible watches"
          placeholder="Search watches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="watch-picker-modal__results">
        {matches.map((watch) => (
          <Button
            key={watch.id}
            variant="ghost"
            className="watch-picker-modal__watch"
            onClick={() => onSelect(watch)}
            aria-label={`${selectionAction} ${watch.name}`}
          >
            <Image
              src={watch.preview}
              alt=""
              width={56}
              height={56}
              className="watch-picker-modal__image"
            />
            <span className="watch-picker-modal__info">
              <span className="u-font-md u-weight-semibold">{watch.name}</span>
              <span className="u-font-xs u-text-secondary">
                {watch.width} × {watch.height} · {watch.display}
              </span>
            </span>
            <ArrowRightIcon size="sm" />
          </Button>
        ))}
        {!matches.length && (
          <p
            role="status"
            className="u-font-sm u-text-secondary py5 u-text-center"
          >
            No compatible watches found. Try another model name.
          </p>
        )}
      </div>
    </dialog>
  );
}

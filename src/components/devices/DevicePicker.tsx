"use client";

import type { Preset } from "@/presets/catalog";
import {
  newDesignSession,
  newDesignSource,
} from "@/library/new-design-session";
import { useState } from "react";
import { Button } from "@/components/ui";
import { devices } from "@/devices/catalog";
import { SearchIcon, SortIcon } from "@/icons";
import { DeviceFilterMenu } from "./DeviceFilterMenu";
import { DeviceCard } from "./DeviceCard";

export function DevicePicker({
  preset,
  create = false,
}: {
  preset?: Preset;
  create?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("asc");
  const [family, setFamily] = useState("all");
  const supportedDevices = devices.filter((device) => device.supported);
  const filtered = supportedDevices
    .filter(
      (device) =>
        `${device.name} ${device.family}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (family === "all" || device.family === family),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
  function reset() {
    setQuery("");
    setFamily("all");
    setSort("asc");
  }

  return (
    <section className="device-picker" aria-labelledby="device-title">
      <header className="device-picker__intro">
        <div className="u-grid gap2">
          <h1 id="device-title" className="device-picker__title">
            {preset
              ? `Choose a watch for ${preset.name}`
              : "Choose your Garmin"}
          </h1>
          <p className="device-picker__description">
            {preset
              ? "Choose a compatible watch to start customizing. We’ll remember it for next time."
              : "Select a device to begin designing with the right display size and capabilities."}
          </p>
        </div>
      </header>
      <div className="device-picker__controls u-grid u-items-center gap2">
        <label className="device-picker__search u-min-w-0">
          <span className="u-sr-only">Search watches</span>
          <SearchIcon size="sm" />
          <input
            type="search"
            placeholder="Search watches"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Button
          iconOnly
          variant="ghost"
          className="u-radius-small"
          aria-label={`Sort by name: ${sort === "asc" ? "A to Z" : "Z to A"}. Switch to ${sort === "asc" ? "Z to A" : "A to Z"}.`}
          title={sort === "asc" ? "Name: A–Z" : "Name: Z–A"}
          onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
        >
          <SortIcon size="sm" descending={sort === "desc"} />
        </Button>
        <DeviceFilterMenu
          families={[
            ...new Set(supportedDevices.map((device) => device.family)),
          ]}
          value={family}
          onChange={setFamily}
        />
      </div>
      <div className="u-flex u-flex-wrap u-items-center u-justify-between gap3 mt4 mb6">
        <h2 className="u-font-md u-weight-semibold">Supported watches</h2>
        <p className="u-font-sm u-text-secondary" role="status">
          {filtered.length} {filtered.length === 1 ? "watch" : "watches"}
        </p>
        {(query || family !== "all" || sort !== "asc") && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        )}
      </div>
      {filtered.length ? (
        <div className="device-picker__grid u-grid gap3">
          {filtered.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              compatible={
                preset
                  ? preset.compatibleDevices.includes(device.id)
                  : undefined
              }
              href={
                preset || create
                  ? `/editor/new?${new URLSearchParams({ ...(preset ? { preset: preset.slug } : {}), watch: device.slug })}`
                  : undefined
              }
              onSelect={
                preset || create
                  ? () => {
                      newDesignSession.begin(
                        newDesignSource(device.id, preset?.slug),
                      );
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="device-picker__empty u-grid gap3 py8 u-text-center">
          <h2 className="u-font-lg u-weight-medium">No watches found</h2>
          <p className="u-font-md u-text-secondary">
            Try another model name or clear your filters.
          </p>
          <div>
            <Button onClick={reset}>Show all watches</Button>
          </div>
        </div>
      )}
    </section>
  );
}

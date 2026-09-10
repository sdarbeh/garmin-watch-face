"use client";
import { SearchIcon } from "@/icons";
import { useState } from "react";
import { presets } from "@/presets/catalog";
import { useLibrary } from "@/library/useLibrary";
import { PresetCard } from "./PresetCard";
export function PresetBrowse() {
  const [query, setQuery] = useState("");
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const { selectedWatch } = useLibrary();
  const filtered = presets.filter(
    (preset) =>
      `${preset.name} ${preset.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!compatibleOnly ||
        !selectedWatch ||
        preset.compatibleDevices.includes(selectedWatch)),
  );
  return (
    <section className="studio-page u-grid gap5">
      <div>
        <h1 className="u-font-3xl u-weight-semibold">Watch face presets</h1>
        <p className="u-text-secondary mt2">
          Choose a starting point and make it yours.
        </p>
      </div>
      <div className="u-flex u-flex-wrap u-items-center gap4">
        <label className="ui-search">
          <span className="u-sr-only">Search presets</span>
          <SearchIcon size="sm" />
          <input
            type="search"
            placeholder="Search presets"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {selectedWatch && (
          <label className="ui-checkbox-label u-font-sm">
            <input
              type="checkbox"
              checked={compatibleOnly}
              onChange={(event) => setCompatibleOnly(event.target.checked)}
            />{" "}
            Compatible with my watch
          </label>
        )}
      </div>
      <div className="studio-grid">
        {filtered.map((preset) => (
          <PresetCard key={preset.slug} preset={preset} headingLevel={2} />
        ))}
      </div>
      {!filtered.length && (
        <p role="status" className="u-text-secondary">
          No presets match your search.
        </p>
      )}
    </section>
  );
}

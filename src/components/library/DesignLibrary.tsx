"use client";
import { useEffect, useRef, useState } from "react";
import { useLibrary } from "@/library/useLibrary";
import { browserLibrary, type SavedDesign } from "@/library/store";
import { SearchIcon, PlusIcon } from "@/icons";
import { getDeviceById } from "@/devices/catalog";
import { Button } from "@/components/ui";
import { StartDesignButton } from "./StartDesignButton";
import { DesignLibraryEmpty } from "./DesignLibraryEmpty";
import { DesignCard } from "./DesignCard";
export function DesignLibrary() {
  const library = useLibrary();
  const [query, setQuery] = useState("");
  const [watchFilter, setWatchFilter] = useState("all");
  const watchIds = [
    ...new Set(library.projects.map((project) => project.selectedWatch)),
  ];
  const activeFilter = watchIds.includes(watchFilter) ? watchFilter : "all";
  const filtered = library.projects
    .filter(
      (project) =>
        `${project.design.name} ${getDeviceById(project.design.device)?.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (activeFilter === "all" || project.selectedWatch === activeFilter),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [removed, setRemoved] = useState<SavedDesign | null>(null);
  const undo = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (removed) undo.current?.focus();
  }, [removed]);
  return (
    <section className="studio-page u-grid gap5">
      <header className="u-flex u-flex-wrap u-justify-between u-items-center gap3">
        <div>
          <h1 className="u-font-3xl u-weight-semibold">My designs</h1>
          <p className="u-text-secondary mt2">
            Create, customize, and export your watch faces.
          </p>
        </div>
        {library.projects.length > 0 && (
          <div className="u-flex gap2">
            <StartDesignButton variant="primary">
              <PlusIcon size="sm" />
              New design
            </StartDesignButton>
          </div>
        )}
      </header>
      {library.projects.length > 0 && (
        <div className="design-library__filters">
          <label className="ui-search">
            <SearchIcon size="sm" />
            <input
              type="search"
              aria-label="Search designs"
              placeholder="Search designs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="ui-field">
            <span className="u-sr-only">Filter by watch</span>
            <select
              aria-label="Filter by watch"
              value={activeFilter}
              onChange={(event) => setWatchFilter(event.target.value)}
            >
              <option value="all">All watches</option>
              {watchIds.map((id) => (
                <option key={id} value={id}>
                  {getDeviceById(id)?.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {(library.error || library.saveStatus.state === "error") && (
        <p role="alert">
          {library.error || "Couldn’t save locally. Keep this tab open."}
        </p>
      )}
      {removed && (
        <div className="u-flex u-items-center gap3">
          <p role="status">Deleted {removed.design.name}.</p>
          <Button
            ref={undo}
            size="sm"
            onClick={() => {
              browserLibrary.restore(removed);
              setRemoved(null);
            }}
          >
            Undo delete
          </Button>
        </div>
      )}
      {!library.ready && <p role="status">Loading designs…</p>}
      {library.ready && !library.error && !library.projects.length && (
        <DesignLibraryEmpty />
      )}
      {library.projects.length > 0 && !filtered.length && (
        <p role="status" className="u-text-secondary">
          No designs match your search.
        </p>
      )}
      <div className="design-library__grid">
        {filtered.map((project) => (
          <DesignCard
            key={project.id}
            project={project}
            onRemove={(project) => {
              browserLibrary.remove(project.id);
              setRemoved(project);
            }}
          />
        ))}
      </div>
    </section>
  );
}

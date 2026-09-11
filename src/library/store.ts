import { getDeviceById } from "../devices/catalog";
import {
  parseProject,
  serializeProject,
  validateDesign,
  type Design,
} from "../watchface/schema";
export const LIBRARY_KEY = "watchface.designs";
export const SELECTED_WATCH_KEY = "watchface.selectedWatch";
export interface SavedDesign {
  id: string;
  design: Design;
  initialDesign: Design;
  selectedWatch: string;
  createdAt: string;
  updatedAt: string;
  downloadedAt?: string;
  presetSlug?: string;
}
export interface LibrarySnapshot {
  projects: SavedDesign[];
  drafts: SavedDesign[];
  selectedWatch: string | null;
  ready: boolean;
  error: string;
  saved: string;
}
export const LIBRARY_SERVER: LibrarySnapshot = {
  projects: [],
  drafts: [],
  selectedWatch: null,
  ready: false,
  error: "",
  saved: "Loading local designs…",
};
type StoragePort = Pick<Storage, "getItem" | "setItem">;

function copyDesign(design: Design) {
  return parseProject(serializeProject(design));
}

export class LibraryStore {
  private snapshot = LIBRARY_SERVER;
  private listeners = new Set<() => void>();
  constructor(private storage: () => StoragePort) {}
  getSnapshot = () => {
    if (!this.snapshot.ready) this.load();
    return this.snapshot;
  };
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    for (const listener of this.listeners) listener();
  }
  load = () => {
    try {
      const raw = this.storage().getItem(LIBRARY_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(entries)) throw new Error("Invalid design library.");
      const ids = new Set<string>();
      const projects = entries.map((project: SavedDesign) => {
        if (
          !project ||
          typeof project.id !== "string" ||
          !/^[a-zA-Z0-9_-]{1,64}$/.test(project.id) ||
          ids.has(project.id) ||
          typeof project.createdAt !== "string" ||
          typeof project.updatedAt !== "string" ||
          !Number.isFinite(Date.parse(project.createdAt)) ||
          !Number.isFinite(Date.parse(project.updatedAt)) ||
          (project.downloadedAt !== undefined &&
            (typeof project.downloadedAt !== "string" ||
              !Number.isFinite(Date.parse(project.downloadedAt)))) ||
          (project.presetSlug !== undefined &&
            typeof project.presetSlug !== "string")
        )
          throw new Error("Invalid saved project.");
        ids.add(project.id);
        const design = validateDesign(project.design);
        const initialDesign = validateDesign(project.initialDesign);
        if (
          project.selectedWatch !== design.device ||
          initialDesign.device !== design.device
        )
          throw new Error("Saved watch does not match the design target.");
        return {
          id: project.id,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          ...(project.downloadedAt
            ? { downloadedAt: project.downloadedAt }
            : {}),
          ...(project.presetSlug ? { presetSlug: project.presetSlug } : {}),
          design,
          initialDesign,
          selectedWatch: design.device,
        };
      });
      this.snapshot = {
        projects,
        drafts: this.snapshot.drafts,
        selectedWatch: this.snapshot.selectedWatch,
        ready: true,
        error: "",
        saved: "Saved on this browser",
      };
    } catch {
      this.snapshot = {
        ...this.snapshot,
        ready: true,
        error:
          "Could not read saved designs. Existing browser data has not been overwritten. Keep this tab open to preserve any unsaved work.",
        saved: "Autosave unavailable — keep this tab open",
      };
    }
    this.loadSelectedWatch();
  };
  private write(projects: SavedDesign[]) {
    let saved = "Saved on this browser";
    try {
      if (this.snapshot.error) throw new Error("Storage needs recovery");
      this.storage().setItem(LIBRARY_KEY, JSON.stringify(projects));
    } catch {
      saved = "Autosave unavailable — keep this tab open";
    }
    this.snapshot = {
      ...this.snapshot,
      projects,
      ready: true,
      saved,
    };
    this.emit();
  }
  find = (id: string) =>
    [...this.getSnapshot().projects, ...this.snapshot.drafts].find(
      (project) => project.id === id,
    );
  openDraft(id: string, design: Design, presetSlug?: string) {
    if (this.find(id)) return;
    const now = new Date().toISOString();
    const initialDesign = copyDesign(design);
    const draft: SavedDesign = {
      id,
      design: copyDesign(initialDesign),
      initialDesign,
      selectedWatch: design.device,
      createdAt: now,
      updatedAt: now,
      ...(presetSlug ? { presetSlug } : {}),
    };
    this.snapshot = {
      ...this.snapshot,
      drafts: [...this.snapshot.drafts, draft],
    };
    this.emit();
  }
  discardDraft(id: string) {
    if (!this.snapshot.drafts.some((p) => p.id === id)) return;
    this.snapshot = {
      ...this.snapshot,
      drafts: this.snapshot.drafts.filter((p) => p.id !== id),
    };
    this.emit();
  }
  create(design: Design, presetSlug?: string) {
    const current = this.getSnapshot();
    const now = new Date().toISOString();
    const initialDesign = copyDesign(design);
    const project: SavedDesign = {
      id: crypto.randomUUID(),
      design: copyDesign(initialDesign),
      initialDesign,
      selectedWatch: design.device,
      createdAt: now,
      updatedAt: now,
      ...(presetSlug ? { presetSlug } : {}),
    };
    this.selectWatch(project.selectedWatch);
    this.write([...current.projects, project]);
    return project;
  }
  update(id: string, design: Design) {
    const current = this.getSnapshot();
    const existing = this.find(id);
    if (!existing)
      throw new Error(
        "This design no longer exists. Open My designs to continue.",
      );
    const valid = copyDesign(design);
    if (serializeProject(existing.design) === serializeProject(valid)) return;
    if (current.drafts.some((project) => project.id === id)) {
      const now = new Date().toISOString();
      this.snapshot = {
        ...this.snapshot,
        drafts: current.drafts.filter((project) => project.id !== id),
      };
      this.write([
        ...current.projects,
        {
          ...existing,
          design: valid,
          selectedWatch: valid.device,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return;
    }
    this.write(
      current.projects.map((project) =>
        project.id === id
          ? {
              ...project,
              design: valid,
              selectedWatch: valid.device,
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    );
  }
  recordDownload(
    design: Design,
    options: { id?: string; presetSlug?: string } = {},
  ) {
    const current = this.getSnapshot();
    const valid = validateDesign(design);
    const existing = options.id
      ? this.find(options.id)
      : current.projects.find(
          (project) =>
            project.presetSlug === options.presetSlug &&
            serializeProject(project.design) === serializeProject(valid),
        );
    const now = new Date().toISOString();
    // A download saves an untouched draft without pretending its content was edited.
    const project: SavedDesign = existing
      ? { ...existing, downloadedAt: now }
      : {
          id: options.id ?? crypto.randomUUID(),
          design: valid,
          initialDesign: copyDesign(valid),
          selectedWatch: valid.device,
          createdAt: now,
          updatedAt: now,
          downloadedAt: now,
          ...(options.presetSlug ? { presetSlug: options.presetSlug } : {}),
        };
    this.snapshot = {
      ...this.snapshot,
      drafts: current.drafts.filter((draft) => draft.id !== project.id),
    };
    this.write([
      ...current.projects.filter((item) => item.id !== project.id),
      project,
    ]);
    return project;
  }
  remove(id: string) {
    this.write(
      this.getSnapshot().projects.filter((project) => project.id !== id),
    );
  }
  restore(project: SavedDesign) {
    if (!this.find(project.id)) {
      const design = copyDesign(project.design);
      const initialDesign = copyDesign(project.initialDesign);
      if (
        project.selectedWatch !== design.device ||
        initialDesign.device !== design.device
      )
        throw new Error("Saved watch does not match the design target.");
      this.write([
        ...this.getSnapshot().projects,
        {
          ...project,
          design,
          initialDesign,
          selectedWatch: design.device,
        },
      ]);
    }
  }
  loadSelectedWatch = () => {
    try {
      const raw = this.storage().getItem(SELECTED_WATCH_KEY);
      const selectedWatch = raw
        ? (getDeviceById(JSON.parse(raw))?.id ?? null)
        : null;
      this.snapshot = { ...this.snapshot, selectedWatch };
    } catch {
      /* Preserve the current session preference if storage cannot be read. */
    }
    this.emit();
  };
  selectWatch(id: string | null) {
    if (id !== null && !getDeviceById(id)?.supported)
      throw new Error("Choose a supported watch.");
    this.getSnapshot();
    try {
      this.storage().setItem(SELECTED_WATCH_KEY, JSON.stringify(id));
    } catch {
      /* Keep the selection usable for this session if storage is blocked. */
    }
    this.snapshot = { ...this.snapshot, selectedWatch: id };
    this.emit();
  }
}
export const browserLibrary = new LibraryStore(() => window.localStorage);

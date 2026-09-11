import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LibraryStore,
  LIBRARY_KEY,
  LOCAL_SAVE_DELAY_MS,
  SELECTED_WATCH_KEY,
} from "@/library/store";
import {
  defaultDesign,
  serializeProject,
  parseProject,
  validateDesign,
} from "@/watchface/schema";
import { presets } from "@/presets/catalog";

afterEach(() => vi.useRealTimers());

function setup() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  return { data, storage, store: new LibraryStore(() => storage) };
}
describe("local design library", () => {
  it("persists separate projects with stable IDs and portable designs", () => {
    const { store, storage } = setup();
    const a = store.create(defaultDesign());
    const b = store.create(defaultDesign());
    store.update(a.id, { ...a.design, name: "Changed" });
    store.flush();
    const reloaded = new LibraryStore(() => storage);
    expect(reloaded.find(a.id)?.design.name).toBe("Changed");
    expect(reloaded.find(b.id)?.design).toEqual(b.design);
    expect(parseProject(serializeProject(reloaded.find(a.id)!.design))).toEqual(
      reloaded.find(a.id)!.design,
    );
  });
  it("debounces edits and reports the completed local write", async () => {
    vi.useFakeTimers();
    const { store, storage } = setup();
    const write = vi.spyOn(storage, "setItem");
    const project = store.create(defaultDesign());
    const created = store.getSnapshot().saveStatus;
    write.mockClear();

    expect(created.state).toBe("saved");
    store.update(project.id, { ...project.design, name: "Updated" });
    store.update(project.id, {
      ...store.find(project.id)!.design,
      name: "Updated again",
    });
    expect(store.getSnapshot().saveStatus.state).toBe("pending");
    expect(write).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(LOCAL_SAVE_DELAY_MS);

    expect(write).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().saveStatus.state).toBe("saved");
    expect(store.getSnapshot().saveStatus.revision).toBe(created.revision + 2);
  });
  it("keeps a queued local edit authoritative during storage sync", () => {
    const { data, store } = setup();
    const project = store.create(defaultDesign());
    store.update(project.id, { ...project.design, name: "Local edit" });
    data.set(LIBRARY_KEY, "[]");

    store.load();

    expect(store.find(project.id)?.design.name).toBe("Local edit");
    store.flush();
    expect(JSON.parse(data.get(LIBRARY_KEY)!)[0].design.name).toBe("Local edit");
  });
  it("copies every preset without modifying the original", () => {
    const { store } = setup();
    for (const preset of presets) {
      expect(validateDesign(preset.design)).toEqual(preset.design);
      const project = store.create(preset.design, preset.slug);
      store.update(project.id, { ...project.design, name: "My copy" });
      expect(preset.design.name).toBe(preset.name);
      expect(store.find(project.id)?.presetSlug).toBe(preset.slug);
      expect(store.find(project.id)?.initialDesign).toEqual(preset.design);
    }
    store.flush();
  });
  it("keeps the exact initial design after edits and reloads", () => {
    const { store, storage } = setup();
    const preset = presets.find((item) => item.slug === "weather-desk")!;
    const project = store.create(preset.design, preset.slug);
    const edited = {
      ...project.design,
      name: "Storm layout",
      background: "#123456",
      layouts: {
        ...project.design.layouts,
        night: {
          background: "#010203",
          elements: project.design.layouts?.night?.elements ?? [],
        },
      },
    };

    store.update(project.id, edited);
    store.flush();

    const saved = new LibraryStore(() => storage).find(project.id)!;
    expect(saved.design).toEqual(validateDesign(edited));
    expect(saved.initialDesign).toEqual(preset.design);
    expect(saved.initialDesign.layouts).toEqual(preset.design.layouts);
  });
  it("remembers watch selection without changing existing projects", () => {
    const { store, storage } = setup();
    const a = store.create(defaultDesign());
    store.selectWatch(null);
    expect(store.find(a.id)).toEqual(a);
    store.selectWatch("fr970");
    expect(new LibraryStore(() => storage).getSnapshot().selectedWatch).toBe(
      "fr970",
    );
    expect(() => store.selectWatch("unknown")).toThrow();
  });
  it("restores a deleted design with its original URL", () => {
    const { store } = setup();
    const a = store.create(defaultDesign());
    store.remove(a.id);
    expect(store.find(a.id)).toBeUndefined();
    expect(() => store.update(a.id, a.design)).toThrow();
    store.restore(a);
    store.restore(a);
    expect(store.getSnapshot().projects).toEqual([a]);
  });
  it("keeps edits in memory if storage is full", () => {
    const { store, storage } = setup();
    const a = store.create(defaultDesign());
    storage.setItem = () => {
      throw new Error("quota");
    };
    store.update(a.id, { ...a.design, name: "Unsaved" });
    store.flush();
    expect(store.find(a.id)?.design.name).toBe("Unsaved");
    expect(store.getSnapshot().saveStatus.state).toBe("error");
  });
  it("does not overwrite corrupt stored data", () => {
    const { store, data } = setup();
    data.set(LIBRARY_KEY, "broken");
    store.create(defaultDesign());
    expect(store.getSnapshot().error).toBeTruthy();
    expect(data.get(LIBRARY_KEY)).toBe("broken");
  });
});

it("keeps unopened and unchanged drafts out of persistent projects", () => {
  const { store, data } = setup();
  store.openDraft("draft", defaultDesign());
  expect(store.find("draft")).toBeDefined();
  expect(store.getSnapshot().projects).toEqual([]);
  store.update("draft", structuredClone(defaultDesign()));
  expect(data.has(LIBRARY_KEY)).toBe(false);
  store.selectWatch("fr970");
  expect(data.has(LIBRARY_KEY)).toBe(false);
  expect(JSON.parse(data.get(SELECTED_WATCH_KEY)!)).toBe("fr970");
  store.discardDraft("draft");
  expect(store.find("draft")).toBeUndefined();
});
it("promotes a draft on its first real edit using the same ID", () => {
  const { store, storage } = setup();
  store.openDraft("draft", presets[0].design, presets[0].slug);
  store.update("draft", { ...presets[0].design, name: "First edit" });
  store.flush();
  expect(store.getSnapshot().drafts).toEqual([]);
  expect(store.getSnapshot().projects).toHaveLength(1);
  const persisted = new LibraryStore(() => storage).find("draft");
  expect(persisted?.design.name).toBe("First edit");
  expect(persisted?.presetSlug).toBe(presets[0].slug);
  store.discardDraft("draft");
  expect(store.find("draft")).toEqual(persisted);
});

it("stores global selection separately and attaches a fixed watch to each project", () => {
  const { store, data } = setup();
  const project = store.create(defaultDesign());
  const designs = data.get(LIBRARY_KEY);
  expect(JSON.parse(designs!)[0].selectedWatch).toBe("fr970");
  store.selectWatch(null);
  expect(data.get(LIBRARY_KEY)).toBe(designs);
  expect(data.get(SELECTED_WATCH_KEY)).toBe("null");
  expect(store.find(project.id)?.selectedWatch).toBe("fr970");
  store.openDraft("new-draft", defaultDesign());
  expect(store.find("new-draft")?.selectedWatch).toBe("fr970");
  store.update("new-draft", { ...defaultDesign(), name: "Edited draft" });
  store.flush();
  expect(JSON.parse(data.get(LIBRARY_KEY)!)[1].selectedWatch).toBe("fr970");
});
it("rejects old library envelopes and records missing required project state", () => {
  for (const raw of [
    JSON.stringify({ projects: [], selectedWatch: "fr970" }),
    JSON.stringify([
      {
        id: "old",
        design: defaultDesign(),
        createdAt: "2026-09-09T12:00:00Z",
        updatedAt: "2026-09-09T12:00:00Z",
      },
    ]),
    JSON.stringify([
      {
        id: "old-with-watch",
        design: defaultDesign(),
        selectedWatch: "fr970",
        createdAt: "2026-09-09T12:00:00Z",
        updatedAt: "2026-09-09T12:00:00Z",
      },
    ]),
  ]) {
    const { store, data } = setup();
    data.set(LIBRARY_KEY, raw);
    expect(store.getSnapshot().error).toBeTruthy();
    expect(data.get(LIBRARY_KEY)).toBe(raw);
  }
});
it("watch preference synchronization does not reload or change unsaved project edits", () => {
  const { store, data } = setup();
  store.openDraft("draft", defaultDesign());
  data.set(SELECTED_WATCH_KEY, '"fr970"');
  store.loadSelectedWatch();
  expect(store.find("draft")).toBeDefined();
  expect(store.getSnapshot().selectedWatch).toBe("fr970");
  expect(data.has(LIBRARY_KEY)).toBe(false);
});

it("loads watch preference independently when saved designs cannot be read", () => {
  const { store, data, storage } = setup();
  data.set(LIBRARY_KEY, "broken");
  data.set(SELECTED_WATCH_KEY, '"fr970"');
  expect(store.getSnapshot().selectedWatch).toBe("fr970");
  expect(store.getSnapshot().error).toBeTruthy();
  store.selectWatch(null);
  expect(
    new LibraryStore(() => storage).getSnapshot().selectedWatch,
  ).toBeNull();
  expect(data.get(LIBRARY_KEY)).toBe("broken");
});

it("saves downloaded drafts and preserves created and edited dates on repeat downloads", () => {
  const { store, storage } = setup();
  store.openDraft("download-draft", defaultDesign());
  const draft = store.find("download-draft")!;
  store.recordDownload(draft.design, { id: draft.id });
  const saved = store.find(draft.id)!;
  expect(saved.createdAt).toBe(draft.createdAt);
  expect(saved.updatedAt).toBe(draft.updatedAt);
  expect(saved.downloadedAt).toBeTruthy();
  expect(store.getSnapshot().drafts).toHaveLength(0);
  store.recordDownload(saved.design, { id: saved.id });
  expect(store.getSnapshot().projects).toHaveLength(1);
  expect(
    new LibraryStore(() => storage).find(saved.id)?.downloadedAt,
  ).toBeTruthy();
  store.update(saved.id, { ...saved.design, name: "Changed after download" });
  store.flush();
  expect(store.find(saved.id)?.downloadedAt).toBeTruthy();
});

it("reuses an unchanged downloaded preset", () => {
  const { store } = setup();
  const preset = presets[0];
  const a = store.recordDownload(preset.design, { presetSlug: preset.slug });
  const b = store.recordDownload(preset.design, { presetSlug: preset.slug });
  expect(b.id).toBe(a.id);
  expect(store.getSnapshot().projects).toHaveLength(1);
});

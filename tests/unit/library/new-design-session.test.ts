import { expect, it } from "vitest";
import {
  NewDesignSession,
  newDesignSource,
} from "../../../src/library/new-design-session";
import { LibraryStore } from "../../../src/library/store";
import { defaultDesign } from "../../../src/watchface/schema";
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
it("restores the saved project after a new-editor reload", () => {
  const tab = storage(),
    local = storage();
  const sessions = new NewDesignSession(() => tab);
  const library = new LibraryStore(() => local);
  const source = newDesignSource("fr970", "simple");
  const session = sessions.resume(source);
  library.openDraft(session.projectId, defaultDesign());
  library.update(session.projectId, { ...defaultDesign(), name: "Edited" });
  const reload = new NewDesignSession(() => tab).resume(source);
  expect(reload.projectId).toBe(session.projectId);
  expect(
    new LibraryStore(() => local).find(reload.projectId)?.design.name,
  ).toBe("Edited");
});
it("starts a separate project for an explicit new action, even for the same preset", () => {
  const session = new NewDesignSession(storage);
  const source = newDesignSource("fr970", "simple");
  const first = session.begin(source);
  expect(session.resume(source)).toEqual(first);
  expect(session.begin(source).projectId).not.toBe(first.projectId);
});
it("does not reuse a different preset session or another tab's pointer", () => {
  const a = new NewDesignSession(storage),
    b = new NewDesignSession(storage);
  const first = a.resume(newDesignSource("fr970", "simple"));
  expect(a.resume(newDesignSource("fr970", "weekend")).projectId).not.toBe(
    first.projectId,
  );
  expect(b.resume(first.source).projectId).not.toBe(first.projectId);
});
it("keeps working in memory when session storage is blocked", () => {
  const session = new NewDesignSession(() => {
    throw new Error("blocked");
  });
  const first = session.resume("scratch");
  expect(session.resume("scratch")).toEqual(first);
});

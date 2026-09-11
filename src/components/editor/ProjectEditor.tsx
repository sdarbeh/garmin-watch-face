"use client";
import { useEffect, useSyncExternalStore } from "react";
import {
  newDesignSession,
  newDesignSource,
} from "@/library/new-design-session";
import { browserLibrary, type LocalSaveStatus } from "@/library/store";
import type { Design } from "@/watchface/schema";
import { useLibrary } from "@/library/useLibrary";
import { EditorWorkspace } from "./EditorWorkspace";
import { Button } from "@/components/ui";
const getServerSession = () => null;
const UNSAVED_STATUS: LocalSaveStatus = { state: "unsaved", revision: 0 };

export function ProjectEditor({
  id,
  initialDesign,
  presetSlug,
}: {
  id: string;
  initialDesign?: Design;
  presetSlug?: string;
}) {
  const session = useSyncExternalStore(
    newDesignSession.subscribe,
    newDesignSession.getSnapshot,
    getServerSession,
  );
  const source = initialDesign
    ? newDesignSource(initialDesign.device, presetSlug)
    : null;
  const draftId = session?.source === source ? session?.projectId : undefined;
  const projectId = id === "new" ? draftId : id;
  const library = useLibrary();
  const savedProject = library.projects.find(
    (project) => project.id === projectId,
  );
  const project =
    savedProject ?? library.drafts.find((project) => project.id === projectId);
  useEffect(() => {
    if (id !== "new" || !initialDesign || !source) return;
    const nextId = newDesignSession.resume(source).projectId;
    browserLibrary.selectWatch(initialDesign.device);
    browserLibrary.openDraft(nextId, initialDesign, presetSlug);
    return () => browserLibrary.discardDraft(nextId);
  }, [id, initialDesign, presetSlug, source]);
  if (
    !library.ready ||
    (id === "new" && initialDesign && session?.source !== source)
  )
    return (
      <p className="studio-page" role="status">
        Loading design…
      </p>
    );
  if (!project)
    return (
      <section className="studio-page u-grid gap4">
        <h1 className="u-font-xl">Design not found on this browser</h1>
        <p>
          {library.error ||
            "Open a saved design from My designs, or choose a watch to start a new one."}
        </p>
        <div>
          <Button href="/designs">My designs</Button>
        </div>
      </section>
    );
  return (
    <EditorWorkspace
      key={project.id}
      project={project}
      saveStatus={savedProject ? library.saveStatus : UNSAVED_STATUS}
      error={library.error}
    />
  );
}

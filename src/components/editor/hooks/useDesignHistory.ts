import { useEffect, useRef, useState } from "react";
import { browserLibrary } from "@/library/store";
import { validateDesign, type Design } from "@/watchface/schema";
import { DesignHistory } from "../model/history";

export function useDesignHistory(projectId: string) {
  const history = useRef(new DesignHistory());
  const [availability, setAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const current = () => browserLibrary.find(projectId)!.design;
  const notify = () =>
    setAvailability({
      canUndo: history.current.canUndo,
      canRedo: history.current.canRedo,
    });
  useEffect(() => {
    const finish = () => {
      const project = browserLibrary.find(projectId);
      if (!project) return;
      history.current.commit(project.design);
      setAvailability({
        canUndo: history.current.canUndo,
        canRedo: history.current.canRedo,
      });
    };
    window.addEventListener("blur", finish);
    return () => window.removeEventListener("blur", finish);
  }, [projectId]);
  return {
    ...availability,
    begin: () => history.current.begin(current()),
    commit: () => {
      history.current.commit(current());
      notify();
    },
    cancel: () => {
      const original = history.current.cancel();
      if (original) browserLibrary.update(projectId, original);
      notify();
    },
    update: (next: Design) => {
      const valid = validateDesign(next);
      history.current.record(current(), valid);
      browserLibrary.update(projectId, valid);
      notify();
    },
    undo: () => {
      browserLibrary.update(projectId, history.current.undo(current()));
      notify();
    },
    redo: () => {
      browserLibrary.update(projectId, history.current.redo(current()));
      notify();
    },
  };
}

"use client";
import { useEffect, useSyncExternalStore } from "react";
import {
  browserLibrary,
  LIBRARY_KEY,
  SELECTED_WATCH_KEY,
  LIBRARY_SERVER,
} from "./store";
export function useLibrary() {
  const snapshot = useSyncExternalStore(
    browserLibrary.subscribe,
    browserLibrary.getSnapshot,
    () => LIBRARY_SERVER,
  );
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === SELECTED_WATCH_KEY) browserLibrary.loadSelectedWatch();
      else if (event.key === LIBRARY_KEY || event.key === null)
        browserLibrary.load();
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") browserLibrary.flush();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("pagehide", browserLibrary.flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pagehide", browserLibrary.flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, []);
  return snapshot;
}

"use client";
import { useEffect, useRef, useState } from "react";
import { serializeProject, type Design } from "@/watchface/schema";
import { compileWatchface, type Build } from "../model/build-client";

export type WatchfaceBuildStatus = "idle" | "building" | "success" | "failure";

export function useWatchfaceBuild(
  design: Design,
  setMessage: (message: string) => void,
) {
  const [build, setBuild] = useState<Build | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const stale = snapshot !== serializeProject(design);
  let status: WatchfaceBuildStatus = "idle";
  if (busy) status = "building";
  else if (!stale && error) status = "failure";
  else if (!stale && build?.state === "success") status = "success";

  async function startBuild(cancellation?: AbortSignal): Promise<Build | null> {
    if (pending.current) return null;
    const abort = new AbortController();
    pending.current = abort;
    const signal = cancellation
      ? AbortSignal.any([abort.signal, cancellation])
      : abort.signal;
    setBusy(true);
    setError("");
    setMessage("");
    setBuild(null);
    try {
      const fixed = serializeProject(design);
      setSnapshot(fixed);
      return await compileWatchface(fixed, signal, setBuild);
    } catch (error) {
      if (!signal.aborted) {
        const message =
          error instanceof Error ? error.message : "Build failed. Try again.";
        setError(message);
        setMessage(message);
      }
    } finally {
      pending.current = null;
      if (!abort.signal.aborted) setBusy(false);
    }
    return null;
  }

  return { build, busy, error, stale, status, startBuild };
}

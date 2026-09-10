const SERVICE = "/api";
export type Build = {
  filename?: string;
  id: string;
  state: "queued" | "building" | "success" | "failure";
  error?: string;
  bytes?: number;
  sha256?: string;
  log?: string;
};
async function request(path: string, options?: RequestInit): Promise<Build> {
  let response: Response;
  try {
    response = await fetch(SERVICE + path, {
      ...options,
      signal: options?.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "The app is not responding. Refresh and retry. Your design is still available in the editor.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The compiler returned an invalid response. Please try again.",
    );
  }
  if (!response.ok)
    throw new Error(
      data?.error || `Compiler request failed (${response.status}).`,
    );
  if (
    !data ||
    typeof data.id !== "string" ||
    !data.id ||
    !["queued", "building", "success", "failure"].includes(data.state)
  )
    throw new Error(
      "The compiler returned an invalid build status. Please try again.",
    );
  return data;
}

/** Poll only while this export is active; cancellation must never publish a late success. */
export async function compileWatchface(
  project: string,
  signal: AbortSignal,
  onProgress: (build: Build) => void,
): Promise<Build> {
  signal.throwIfAborted();
  let result = await request("/builds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: project,
    signal,
  });
  while (true) {
    signal.throwIfAborted();
    onProgress(result);
    if (result.state === "success") return result;
    if (result.state === "failure")
      throw new Error(result.error || "Build failed. Please try again.");
    await new Promise((resolve) => setTimeout(resolve, 800));
    signal.throwIfAborted();
    result = await request(`/builds/${result.id}`, {
      signal,
    });
  }
}

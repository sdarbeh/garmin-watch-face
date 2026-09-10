import { MAX_PROJECT_BYTES } from "../../src/watchface/schema";

export async function readProjectBody(request: Request, timeoutMs = 10000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Project JSON is required.");
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, timeoutMs);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (timedOut)
        throw new Error("Project upload timed out. Retry the build.");
      if (done) break;
      size += value.length;
      if (size > MAX_PROJECT_BYTES) {
        await reader.cancel();
        throw new Error("Project exceeds the 1.5 MB limit.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

import { devices } from "../../src/devices/catalog";
import { BuildQueue, configFromEnvironment, preflight } from "./compiler";
import { parseProject } from "../../src/watchface/schema";

import { readProjectBody } from "./request-body";

// A single persistent queue across requests and development module reloads.
// This requires a local Node server; it is not a serverless deployment.
const state = globalThis as typeof globalThis & {
  watchfaceCompiler?: ReturnType<typeof createCompiler>;
};
function createCompiler() {
  const config = configFromEnvironment();
  const queue = new BuildQueue(config);
  const timer = setInterval(() => queue.prune(), 60000);
  timer.unref();
  const stop = () => {
    clearInterval(timer);
    void queue.shutdown();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  return { config, queue };
}
function compiler() {
  return (state.watchfaceCompiler ??= createCompiler());
}
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (status: number, data: unknown) =>
  Response.json(data, { status, headers });
export async function handleCompilerRequest(request: Request) {
  const host = request.headers.get("host") || "";
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host))
    return json(403, { error: "Local hosts only." });
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://${host}`)
    return json(403, { error: "Origin is not allowed." });
  const path = new URL(request.url).pathname.replace(/^\/api/, "");
  try {
    const { config, queue } = compiler();
    if (request.method === "GET" && path === "/health")
      return json(200, {
        devices: devices.map((device) => device.id),
        mode: "local",
        errors: await preflight(config),
      });
    if (request.method === "POST" && path === "/builds") {
      if (
        !origin ||
        request.headers.get("content-type")?.split(";")[0] !==
          "application/json"
      )
        return json(403, {
          error: "Builds require a same-origin JSON request.",
        });
      const design = parseProject(await readProjectBody(request));
      try {
        return json(202, queue.enqueue(design));
      } catch (error) {
        return json(429, { error: (error as Error).message });
      }
    }
    const match = /^\/builds\/([a-f0-9-]{36})(\/download)?$/.exec(path);
    if (request.method === "GET" && match) {
      const job = queue.get(match[1]);
      if (!job)
        return json(404, {
          error:
            "Build is missing or expired. Build again; downloads expire after 15 minutes or an app restart.",
        });
      if (!match[2]) return json(200, job.result);
      if (job.result.state !== "success" || !job.artifact)
        return json(409, {
          error: "No compiled watch file is available for this build.",
        });
      return new Response(new Uint8Array(job.artifact), {
        headers: {
          ...headers,
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${job.result.filename}"`,
          "Content-Length": String(job.artifact.length),
        },
      });
    }
    return json(404, { error: "Not found." });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Invalid request.",
    });
  }
}

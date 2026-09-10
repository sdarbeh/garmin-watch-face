import { afterEach, expect, it, vi } from "vitest";
import { compileWatchface } from "../../../src/components/editor/model/build-client";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("polls until the compiled file is ready", async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ id: "job", state: "queued" }))
    .mockResolvedValueOnce(Response.json({ id: "job", state: "building" }))
    .mockResolvedValueOnce(Response.json({ id: "job", state: "success" }));
  vi.stubGlobal("fetch", fetcher);
  const progress = vi.fn();
  const result = compileWatchface("{}", new AbortController().signal, progress);
  await vi.advanceTimersByTimeAsync(1600);
  expect(await result).toEqual({ id: "job", state: "success" });
  expect(progress.mock.calls.map(([build]) => build.state)).toEqual([
    "queued",
    "building",
    "success",
  ]);
});

it("does not publish a late success after cancellation", async () => {
  const abort = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      abort.abort();
      return Response.json({ id: "job", state: "success" });
    }),
  );
  const progress = vi.fn();
  await expect(
    compileWatchface("{}", abort.signal, progress),
  ).rejects.toThrow();
  expect(progress).not.toHaveBeenCalled();
});

it("surfaces build failures without polling again", async () => {
  const fetcher = vi.fn(async () =>
    Response.json({ id: "job", state: "failure", error: "Missing font" }),
  );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    compileWatchface("{}", new AbortController().signal, vi.fn()),
  ).rejects.toThrow("Missing font");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("explains non-JSON server failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("Server unavailable", { status: 503 })),
  );
  await expect(
    compileWatchface("{}", new AbortController().signal, vi.fn()),
  ).rejects.toThrow("invalid response");
});

it("rejects malformed statuses instead of polling indefinitely", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ id: "job", state: "unknown" })),
  );
  await expect(
    compileWatchface("{}", new AbortController().signal, vi.fn()),
  ).rejects.toThrow("invalid build status");
});

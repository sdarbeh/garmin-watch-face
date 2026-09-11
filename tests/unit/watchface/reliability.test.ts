import { afterEach, describe, expect, it, vi } from "vitest";
import { createThemeStore } from "@/providers/theme-store";
import { readProjectBody } from "../../../services/watchface/request-body";

afterEach(() => vi.useRealTimers());

describe("theme preference fallback", () => {
  it("retains a changed theme when writes fail but old storage remains readable", () => {
    const store = createThemeStore(
      () => ({
        getItem: () => "light",
        setItem: () => {
          throw new Error("quota");
        },
      }),
      "theme",
    );
    expect(store.getSnapshot()).toBe("light");
    store.setMode("dark");
    expect(store.getSnapshot()).toBe("dark");
  });
  it("works when all browser storage access is blocked", () => {
    const store = createThemeStore(() => {
      throw new Error("blocked");
    }, "theme");
    expect(store.getSnapshot()).toBe("auto");
    store.setMode("dark");
    expect(store.getSnapshot()).toBe("dark");
  });
});

describe("project upload boundaries", () => {
  it("rejects an unfinished upload even if received bytes contain complete JSON", async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("{}"));
      },
    });
    const request = { body: stream } as Request;
    const result = expect(readProjectBody(request, 10)).rejects.toThrow(
      "timed out",
    );
    await vi.advanceTimersByTimeAsync(10);
    await result;
  });
  it("accepts a complete body and rejects oversized input", async () => {
    expect(
      await readProjectBody(
        new Request("http://localhost", { method: "POST", body: "{}" }),
      ),
    ).toBe("{}");
    await expect(
      readProjectBody(
        new Request("http://localhost", {
          method: "POST",
          body: " ".repeat(1572865),
        }),
      ),
    ).rejects.toThrow("1.5 MB");
  });
});

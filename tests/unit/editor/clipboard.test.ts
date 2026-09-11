import { describe, expect, it } from "vitest";
import { nextPastePosition } from "@/components/editor/model/clipboard";

describe("editor clipboard", () => {
  it("uses a visible 12 pixel offset when no canvas point is available", () => {
    expect(nextPastePosition({ x: 200, y: 160 })).toEqual({ x: 212, y: 172 });
  });

  it("cascades repeated pastes from the copied position", () => {
    expect(nextPastePosition({ x: 200, y: 160 }, 2)).toEqual({
      x: 236,
      y: 196,
    });
  });
});

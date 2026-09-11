import { describe, expect, it } from "vitest";
import {
  layersInSelection,
  mergeMarqueeSelection,
  selectionRect,
} from "../../../src/components/editor/model/selection";
import { createElement, defaultDesign } from "../../../src/watchface/schema";

describe("marquee selection", () => {
  it("normalizes rectangles dragged in either direction", () => {
    expect(selectionRect({ x: 180, y: 150 }, { x: 80, y: 90 })).toEqual({
      x: 80,
      y: 90,
      width: 100,
      height: 60,
    });
  });

  it("selects intersecting visible, unlocked layers", () => {
    const first = { ...createElement("text", "first"), x: 100, y: 100 };
    const locked = {
      ...createElement("text", "locked"),
      x: 120,
      y: 120,
      locked: true,
    };
    const hidden = {
      ...createElement("text", "hidden"),
      x: 140,
      y: 140,
      visible: false,
    };
    const outside = { ...createElement("text", "outside"), x: 350, y: 350 };
    const design = {
      ...defaultDesign(),
      elements: [first, locked, hidden, outside],
    };

    expect(
      layersInSelection(design, { x: 50, y: 50, width: 150, height: 150 }),
    ).toEqual(["first"]);
  });

  it("adds and toggles hits against the selection at drag start", () => {
    expect(mergeMarqueeSelection(["a"], ["b"], "add")).toEqual(["a", "b"]);
    expect(mergeMarqueeSelection(["a", "b"], ["b", "c"], "toggle")).toEqual([
      "a",
      "c",
    ]);
  });
});

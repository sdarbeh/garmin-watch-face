import { describe, expect, it } from "vitest";
import {
  layersInSelection,
  layerSelectionState,
  mergeMarqueeSelection,
  pointInsideRect,
  resolveModeSelection,
  selectionBounds,
  selectionRect,
} from "../../../src/components/editor/model/selection";
import { createElement, defaultDesign } from "../../../src/watchface/schema";

describe("marquee selection", () => {
  it("resolves shared group state once for every editor surface", () => {
    const design = defaultDesign();
    const ids = [design.elements[0].id, design.elements[2].id];
    const state = layerSelectionState(design, ids[1], [...ids, "missing"]);

    expect(state).toMatchObject({
      ids,
      multiple: true,
      locked: false,
      allVisible: true,
      atFront: false,
      atBack: false,
    });
    expect(state?.primary.id).toBe(ids[1]);
  });

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

  it("uses the visual group bounds for gap context clicks", () => {
    const first = { ...createElement("text", "first"), x: 100, y: 100 };
    const second = { ...createElement("text", "second"), x: 300, y: 300 };
    const design = { ...defaultDesign(), elements: [first, second] };
    const bounds = selectionBounds(design, [first.id, second.id]);

    expect(bounds).not.toBeNull();
    expect(pointInsideRect({ x: 200, y: 200 }, bounds!)).toBe(true);
    expect(pointInsideRect({ x: 450, y: 450 }, bounds!)).toBe(false);
  });

  it("restores valid mode selections and removes stale IDs", () => {
    const design = defaultDesign();
    expect(
      resolveModeSelection(design, {
        selected: "missing",
        selectedIds: ["steps", "missing"],
      }),
    ).toEqual({ selected: "steps", selectedIds: ["steps"] });
  });

  it("selects a matching layer type when a mode has no history", () => {
    const design = defaultDesign();
    expect(resolveModeSelection(design, undefined, "date")).toEqual({
      selected: "date",
      selectedIds: ["date"],
    });
  });
});

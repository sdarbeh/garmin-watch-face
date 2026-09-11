import { describe, expect, it } from "vitest";
import { defaultDesign, validateDesign } from "@/watchface/schema";
import { DesignHistory } from "@/components/editor/model/history";
import {
  elementBounds,
  moveElement,
  snapPosition,
} from "@/components/editor/model/geometry";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";

describe("design history", () => {
  it("groups an entire drag and restores coordinates with undo and redo", () => {
    const h = new DesignHistory();
    const start = defaultDesign();
    const middle = moveElement(start, "time", 250, 200);
    const end = moveElement(start, "time", 270, 210);
    h.begin(start);
    h.record(start, middle);
    h.record(middle, end);
    h.commit(end);
    expect(h.undo(end)).toEqual(start);
    expect(h.canUndo).toBe(false);
    expect(h.redo(start)).toEqual(end);
  });
  it("preserves redo after a no-op gesture and clears it on a new edit", () => {
    const h = new DesignHistory();
    const start = defaultDesign();
    const end = moveElement(start, "date", 250, 120);
    h.record(start, end);
    h.undo(end);
    h.begin(start);
    h.commit(start);
    expect(h.canRedo).toBe(true);
    h.record(start, end);
    expect(h.canRedo).toBe(false);
  });
  it("cancels a gesture without adding an undo step", () => {
    const h = new DesignHistory();
    const start = defaultDesign();
    h.begin(start);
    expect(h.cancel()).toEqual(start);
    expect(h.canUndo).toBe(false);
  });
  it("restores an entire multi-mode reset as one undoable edit", () => {
    const h = new DesignHistory();
    const initial = defaultDesign();
    const edited = validateDesign({
      ...initial,
      name: "Edited face",
      layouts: {
        ...initial.layouts,
        "low-battery": {
          background: "#000000",
          elements: [],
        },
        night: {
          background: "#010101",
          elements: [],
        },
      },
    });

    h.record(edited, initial);

    expect(h.undo(initial)).toEqual(edited);
    expect(h.canUndo).toBe(false);
    expect(h.redo(edited)).toEqual(initial);
  });
});
describe("positioning", () => {
  it("clamps and rounds to schema-valid pixels without altering other elements", () => {
    const start = defaultDesign();
    const next = moveElement(start, "time", -10, 1000);
    expect(
      next.elements.find((element) => element.type === "time")!,
    ).toMatchObject({ x: 50, y: 404 });
    expect(next.elements.find((element) => element.type === "date")!).toEqual(
      start.elements.find((element) => element.type === "date")!,
    );
    expect(validateDesign(next)).toEqual(next);
    expect(renderModel(next).find((e) => e.id === "time")).toMatchObject({
      x: 50,
      y: 404,
    });
  });
  it("snaps near the display center but leaves distant positions alone", () => {
    const design = defaultDesign();
    expect(snapPosition(design, "time", 230, 197, 6).x).toBe(227);
    const far = snapPosition(design, "time", 260, 197, 0.1);
    expect(far.x).toBe(260);
  });
});

it("shows guides for exact keyboard alignment without pulling a one-pixel nudge back", () => {
  const design = defaultDesign();
  const aligned = snapPosition(design, "time", 227, 197, 0);
  expect(aligned.guides).toContainEqual({ axis: "x", value: 227 });
  const nudged = snapPosition(design, "time", 228, 197, 0);
  expect(nudged.x).toBe(228);
  expect(nudged.guides.some((guide) => guide.axis === "x")).toBe(false);
});

it("does not replay an old redo branch over an in-progress edit", () => {
  const history = new DesignHistory();
  const original = defaultDesign();
  const first = moveElement(original, "time", 240, 197);
  history.record(original, first);
  history.undo(first);
  history.begin(original);
  const latest = moveElement(original, "date", 260, 115);
  expect(history.redo(latest)).toEqual(latest);
  expect(history.canRedo).toBe(false);
  expect(history.undo(latest)).toEqual(original);
});

it("uses simulated text width when snapping and tolerates a removed layer", () => {
  const design = defaultDesign();
  design.elements = design.elements.filter((e) => e.id === "steps");
  const samples = { ...SAMPLE_DATA, steps: "999999 steps" };
  const halfWidth = elementBounds(renderModel(design, samples)[0]).width / 2;
  const x = Math.round(227 - halfWidth);
  const result = snapPosition(design, "steps", x, 100, 0, samples);
  expect(result.guides).toContainEqual({ axis: "x", value: 227 });
  expect(snapPosition(design, "steps", x, 100, 0).guides).not.toContainEqual({
    axis: "x",
    value: 227,
  });
  expect(snapPosition(design, "removed", 200, 100, 6)).toEqual({
    x: 200,
    y: 100,
    guides: [],
  });
});

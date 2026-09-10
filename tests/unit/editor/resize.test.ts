import { expect, it } from "vitest";
import {
  createElement,
  defaultDesign,
  presentation,
  validateDesign,
} from "../../../src/watchface/schema";
import { renderModel } from "../../../src/watchface/render-model";
import { FONT_SIZES } from "../../../src/watchface/fonts";
import {
  RESIZE_CORNERS,
  cornerPoint,
  resizeLayer,
} from "../../../src/components/editor/model/resize";
import { DesignHistory } from "../../../src/components/editor/model/history";
function graphic(type: "shape" | "image" = "shape") {
  const design = defaultDesign();
  const element = createElement(type, "resizable");
  element.presentation = { ...presentation(element), width: 100, height: 80 };
  design.elements = [element];
  return design;
}
it.each(RESIZE_CORNERS)(
  "resizes %s without moving the opposite corner",
  (corner) => {
    const design = graphic();
    const opposite = RESIZE_CORNERS[(RESIZE_CORNERS.indexOf(corner) + 2) % 4];
    const before = cornerPoint(renderModel(design)[0], opposite);
    const result = resizeLayer(
      design,
      "resizable",
      corner,
      corner.includes("e") ? 40 : -40,
      corner.includes("s") ? 20 : -20,
      0,
    );
    expect(presentation(result.design.elements[0])).toMatchObject({
      width: 140,
      height: 100,
    });
    expect(cornerPoint(renderModel(result.design)[0], opposite)).toEqual(
      before,
    );
    expect(validateDesign(result.design)).toEqual(result.design);
  },
);
it.each(["left", "center", "right"] as const)(
  "resizes %s-aligned text using supported glyph sizes",
  (alignment) => {
    const design = defaultDesign();
    design.elements = [
      { ...createElement("time", "time"), size: 64, alignment },
    ];
    const anchor = cornerPoint(renderModel(design)[0], "nw");
    const result = resizeLayer(design, "time", "se", 30, 30, 0).design;
    expect(result.elements[0].size).toBeGreaterThan(64);
    expect(FONT_SIZES).toContain(result.elements[0].size);
    const after = cornerPoint(renderModel(result)[0], "nw");
    expect(Math.abs(after.x - anchor.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(after.y - anchor.y)).toBeLessThanOrEqual(0.5);
  },
);
it("preserves image proportions and clamps extreme drags to valid dimensions", () => {
  const design = graphic("image");
  const result = resizeLayer(design, "resizable", "se", 1000, 2000, 0).design;
  const p = presentation(result.elements[0]);
  expect(p.width).toBe(454);
  expect(Math.abs(p.width / p.height - 1.25)).toBeLessThan(0.01);
  expect(validateDesign(result)).toEqual(result);
  const small = resizeLayer(design, "resizable", "se", -1000, -1000, 0).design;
  expect(presentation(small.elements[0]).height).toBe(8);
});
it("snaps the moving edge and displays a guide only at its actual position", () => {
  const design = graphic();
  design.elements[0].x = 170;
  const result = resizeLayer(design, "resizable", "se", 5, 0, 6);
  expect(
    Math.abs(cornerPoint(renderModel(result.design)[0], "se").x - 227),
  ).toBeLessThanOrEqual(0.5);
  expect(result.guides).toContainEqual({ axis: "x", value: 227 });
  expect(resizeLayer(design, "resizable", "se", 5, 0, 0).guides).toEqual([]);
});
it("ignores locked, hidden and missing layers and no-op drags", () => {
  const design = graphic();
  expect(resizeLayer(design, "resizable", "se", 0, 0, 6).design).toBe(design);
  design.elements[0].locked = true;
  expect(resizeLayer(design, "resizable", "se", 50, 50, 6).design).toBe(design);
  design.elements[0].locked = false;
  design.elements[0].visible = false;
  expect(resizeLayer(design, "resizable", "se", 50, 50, 6).design).toBe(design);
  expect(resizeLayer(design, "missing", "se", 50, 50, 6).design).toBe(design);
});
it("groups repeated resize updates into one undo and supports cancellation", () => {
  const history = new DesignHistory();
  const start = graphic();
  const mid = resizeLayer(start, "resizable", "se", 20, 20, 0).design;
  const end = resizeLayer(start, "resizable", "se", 60, 60, 0).design;
  history.begin(start);
  history.record(start, mid);
  history.record(mid, end);
  history.commit(end);
  expect(history.undo(end)).toEqual(start);
  expect(history.canUndo).toBe(false);
  expect(history.redo(start)).toEqual(end);
  history.begin(end);
  expect(history.cancel()).toEqual(end);
});

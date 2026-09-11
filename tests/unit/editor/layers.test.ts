import { expect, it } from "vitest";
import {
  defaultDesign,
  parseProject,
  serializeProject,
  validateDesign,
  createElement,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { renderModel } from "@/watchface/render-model";
import {
  addLayer,
  duplicateLayer,
  reorderLayer,
  reorderLayers,
  placeLayers,
} from "@/components/editor/model/layers";
import {
  moveElement,
  moveElementsBy,
} from "@/components/editor/model/geometry";

it("round-trips repeated types, order, visibility, locks and literal text", () => {
  let d = duplicateLayer(defaultDesign(), "time", "second-time");
  d = addLayer(d, "text", "label");
  d.elements.find((element) => element.id === "label")!.text =
    'Run "fast" \\ rest';
  d.elements.find((element) => element.id === "time")!.locked = true;
  d.elements[2].visible = false;
  d = reorderLayer(d, "label", 1);
  expect(parseProject(serializeProject(d))).toEqual(d);
  const model = renderModel(d);
  expect(model.map((e) => e.id)).toEqual(
    d.elements.filter((e) => e.visible).map((e) => e.id),
  );
  const source = generateProject(d)["source/FaceApp.mc"];
  expect(source).toContain(JSON.stringify('Run "fast" \\ rest'));
  const draws = source
    .split("\n")
    .filter((line) => line.includes("dc.drawText"))
    .slice(-model.length);
  expect(draws).toHaveLength(model.length);
  model.forEach((element, index) =>
    expect(draws[index]).toContain(`dc.drawText(${element.x}, ${element.y},`),
  );
});
it("locking prevents moves, duplication and reordering but still renders", () => {
  const d = defaultDesign();
  d.elements.find((element) => element.id === "time")!.locked = true;
  expect(moveElement(d, "time", 100, 100)).toEqual(d);
  expect(duplicateLayer(d, "time", "copy")).toEqual(d);
  expect(reorderLayer(d, "time", 1)).toEqual(d);
  expect(renderModel(d).some((element) => element.id === "time")).toBe(true);
});

it("offsets duplicates visibly and keeps them inside the editable canvas", () => {
  const design = defaultDesign();
  const source = design.elements.find((element) => element.id === "time")!;
  const duplicated = duplicateLayer(design, source.id, "time-copy");
  expect(
    duplicated.elements.find((element) => element.id === "time-copy"),
  ).toMatchObject({
    x: source.x + 12,
    y: source.y + 12,
  });

  const edgeDesign = {
    ...design,
    elements: design.elements.map((element) =>
      element.id === source.id ? { ...element, x: 404, y: 404 } : element,
    ),
  };
  const edgeCopy = duplicateLayer(edgeDesign, source.id, "edge-copy");
  expect(
    edgeCopy.elements.find((element) => element.id === "edge-copy"),
  ).toMatchObject({
    x: 392,
    y: 392,
  });
});

it("moves selected layers as a group while preserving their spacing", () => {
  const design = defaultDesign();
  const selected = design.elements.slice(0, 2);
  const moved = moveElementsBy(
    design,
    selected.map((element) => element.id),
    18,
    -12,
  );
  for (const element of selected) {
    expect(moved.elements.find((item) => item.id === element.id)).toMatchObject(
      {
        x: element.x + 18,
        y: element.y - 12,
      },
    );
  }
});

it("does not partially move a selection containing a locked layer", () => {
  const design = defaultDesign();
  const ids = design.elements.slice(0, 2).map((element) => element.id);
  const locked = {
    ...design,
    elements: design.elements.map((element) =>
      element.id === ids[0] ? { ...element, locked: true } : element,
    ),
  };

  expect(moveElementsBy(locked, ids, 12, 12)).toEqual(locked);
  expect(moveElementsBy(design, [ids[0], "missing"], 12, 12)).toEqual(design);
});

it("reorders a selected group while preserving its internal order", () => {
  const design = defaultDesign();
  const ids = [design.elements[0].id, design.elements[2].id];
  const front = reorderLayers(design, ids, "front");
  expect(front.elements.slice(-2).map((element) => element.id)).toEqual(ids);

  const backward = reorderLayers(design, ids, -1);
  expect(backward.elements.map((element) => element.id)).toEqual([
    design.elements[0].id,
    design.elements[2].id,
    design.elements[1].id,
    design.elements[3].id,
  ]);
});

it("places a dragged layer directly above or below its drop target", () => {
  const design = defaultDesign();
  const movedAbove = placeLayers(design, ["battery"], "time", "above");
  expect(movedAbove.elements.map((element) => element.id)).toEqual([
    "steps",
    "time",
    "battery",
    "date",
  ]);

  const movedBelow = placeLayers(design, ["date"], "steps", "below");
  expect(movedBelow.elements.map((element) => element.id)).toEqual([
    "battery",
    "date",
    "steps",
    "time",
  ]);
});
it("rejects duplicate IDs, malformed elements and excessive layers", () => {
  const d = defaultDesign();
  expect(() =>
    validateDesign({ ...d, elements: [d.elements[0], d.elements[0]] }),
  ).toThrow();
  expect(() =>
    validateDesign({
      ...d,
      elements: Array.from({ length: 17 }, (_, i) =>
        createElement("text", `text-${i}`),
      ),
    }),
  ).toThrow();
  expect(() =>
    validateDesign({ ...d, elements: [{ ...d.elements[0], visible: "yes" }] }),
  ).toThrow();
  expect(() =>
    validateDesign({
      ...d,
      elements: [{ ...createElement("text", "label"), text: "line\nbreak" }],
    }),
  ).toThrow();
  expect(validateDesign({ ...d, elements: [] }).elements).toEqual([]);
});

it("lists starter layers in Date, Time, Steps, Battery order", () => {
  expect(
    [...defaultDesign().elements].reverse().map((element) => element.type),
  ).toEqual(["date", "time", "steps", "battery"]);
});

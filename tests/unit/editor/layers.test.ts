import { expect, it } from "vitest";
import {
  defaultDesign,
  parseProject,
  serializeProject,
  validateDesign,
  createElement,
} from "../../../src/watchface/schema";
import { generateProject } from "../../../src/watchface/generator";
import { renderModel } from "../../../src/watchface/render-model";
import {
  addLayer,
  duplicateLayer,
  reorderLayer,
} from "../../../src/components/editor/model/layers";
import { moveElement } from "../../../src/components/editor/model/geometry";

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

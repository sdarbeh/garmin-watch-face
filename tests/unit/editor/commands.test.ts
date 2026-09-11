import { describe, expect, it } from "vitest";
import { executeEditorCommand } from "../../../src/components/editor/model/commands";
import { defaultDesign, validateDesign } from "../../../src/watchface/schema";

const id = (value: string) => () => value;

describe("editor commands", () => {
  it("owns IDs and selection for adding, duplicating, and deleting layers", () => {
    const initial = defaultDesign();
    const added = executeEditorCommand(
      initial,
      "normal",
      { type: "layer.add", layerType: "weather" },
      id("weather-layer"),
    );

    expect(added.selection).toBe("weather-layer");
    expect(added.design.elements[0]).toMatchObject({
      id: "weather-layer",
      type: "weather",
    });

    const duplicated = executeEditorCommand(
      added.design,
      "normal",
      { type: "layer.duplicate", id: "weather-layer" },
      id("weather-copy"),
    );
    expect(duplicated.selection).toBe("weather-copy");
    expect(duplicated.design.elements[1]).toMatchObject({
      id: "weather-copy",
      type: "weather",
    });

    const deleted = executeEditorCommand(duplicated.design, "normal", {
      type: "layer.delete",
      id: "weather-copy",
    });
    expect(deleted.selection).toBe("background");
    expect(
      deleted.design.elements.some((item) => item.id === "weather-copy"),
    ).toBe(false);
  });

  it("applies lock rules consistently to every command surface", () => {
    const initial = defaultDesign();
    const locked = executeEditorCommand(initial, "normal", {
      type: "layer.toggle-lock",
      id: "time",
    });
    expect(
      locked.design.elements.find((item) => item.id === "time")?.locked,
    ).toBe(true);

    for (const command of [
      { type: "layer.toggle-visibility", id: "time" },
      { type: "layer.delete", id: "time" },
      { type: "layer.reorder", id: "time", placement: "forward" },
      { type: "layer.update", id: "time", patch: { color: "#123456" } },
    ] as const) {
      const result = executeEditorCommand(locked.design, "normal", command);
      expect(result.design).toEqual(locked.design);
    }

    const unlocked = executeEditorCommand(locked.design, "normal", {
      type: "layer.toggle-lock",
      id: "time",
    });
    expect(
      unlocked.design.elements.find((item) => item.id === "time")?.locked,
    ).toBe(false);
  });

  it("edits only the active display mode", () => {
    const normal = defaultDesign();
    const project = validateDesign({
      ...normal,
      layouts: {
        ...normal.layouts,
        "low-battery": {
          background: "#000000",
          elements: normal.elements,
        },
      },
    });

    const result = executeEditorCommand(project, "low-battery", {
      type: "layer.toggle-visibility",
      id: "time",
    });

    expect(
      result.design.elements.find((item) => item.id === "time")?.visible,
    ).toBe(true);
    expect(
      result.design.layouts?.["low-battery"]?.elements.find(
        (item) => item.id === "time",
      )?.visible,
    ).toBe(false);
  });

  it("moves layers through the same validated command path", () => {
    const initial = defaultDesign();
    const result = executeEditorCommand(initial, "normal", {
      type: "layer.move",
      id: "time",
      x: 260,
      y: 210,
    });

    expect(
      result.design.elements.find((item) => item.id === "time"),
    ).toMatchObject({ x: 260, y: 210 });
  });

  it("moves a multi-selection in one command", () => {
    const initial = defaultDesign();
    const ids = initial.elements.slice(0, 2).map((element) => element.id);
    const before = initial.elements.filter((element) =>
      ids.includes(element.id),
    );
    const result = executeEditorCommand(initial, "normal", {
      type: "layer.move-many",
      ids,
      dx: 8,
      dy: 6,
    });

    for (const element of before) {
      expect(
        result.design.elements.find((item) => item.id === element.id),
      ).toMatchObject({ x: element.x + 8, y: element.y + 6 });
    }
  });

  it("duplicates a group with one shared offset at the canvas edge", () => {
    const initial = defaultDesign();
    const sources = initial.elements.slice(0, 2).map((element, index) => ({
      ...element,
      x: 390 + index * 14,
    }));
    const design = { ...initial, elements: sources };
    let nextId = 0;
    const result = executeEditorCommand(
      design,
      "normal",
      {
        type: "layer.duplicate-many",
        ids: sources.map((element) => element.id),
      },
      () => `copy-${nextId++}`,
    );
    const copies = result.design.elements.slice(-2);

    expect(copies[1].x - copies[0].x).toBe(sources[1].x - sources[0].x);
    expect(Math.max(...copies.map((element) => element.x))).toBe(404);
  });

  it("pastes an unlocked copy with a new ID at the requested position", () => {
    const initial = defaultDesign();
    const source = {
      ...initial.elements.find((item) => item.id === "time")!,
      locked: true,
    };
    const result = executeEditorCommand(
      initial,
      "normal",
      {
        type: "layer.paste",
        elements: [source],
        anchor: { x: source.x, y: source.y },
        position: { x: source.x + 12, y: source.y + 12 },
      },
      id("pasted-time"),
    );

    expect(result.selection).toBe("pasted-time");
    expect(result.design.elements.at(-1)).toMatchObject({
      id: "pasted-time",
      type: "time",
      locked: false,
      x: source.x + 12,
      y: source.y + 12,
    });
  });

  it("keeps point-based pastes within the editable canvas bounds", () => {
    const initial = defaultDesign();
    const source = initial.elements.find((item) => item.id === "time")!;
    const result = executeEditorCommand(
      initial,
      "normal",
      {
        type: "layer.paste",
        elements: [source],
        anchor: { x: source.x, y: source.y },
        position: { x: -20, y: 500 },
      },
      id("bounded-paste"),
    );

    expect(result.design.elements.at(-1)).toMatchObject({
      id: "bounded-paste",
      x: 50,
      y: 404,
    });
  });

  it("pastes multiple layers while preserving their relative spacing", () => {
    const initial = defaultDesign();
    const sources = initial.elements.slice(0, 2);
    let nextId = 0;
    const result = executeEditorCommand(
      initial,
      "normal",
      {
        type: "layer.paste",
        elements: sources,
        anchor: { x: sources[0].x, y: sources[0].y },
        position: { x: sources[0].x + 20, y: sources[0].y + 10 },
      },
      () => `group-copy-${nextId++}`,
    );

    const copies = result.design.elements.slice(-2);
    expect(result.selections).toEqual(["group-copy-0", "group-copy-1"]);
    expect(copies[1].x - copies[0].x).toBe(sources[1].x - sources[0].x);
    expect(copies[1].y - copies[0].y).toBe(sources[1].y - sources[0].y);
  });

  it("supports step and edge layer arranging", () => {
    const initial = defaultDesign();
    const front = executeEditorCommand(initial, "normal", {
      type: "layer.reorder",
      id: "time",
      placement: "front",
    });
    expect(front.design.elements.at(-1)?.id).toBe("time");

    const back = executeEditorCommand(front.design, "normal", {
      type: "layer.reorder",
      id: "time",
      placement: "back",
    });
    expect(back.design.elements[0].id).toBe("time");

    const forward = executeEditorCommand(back.design, "normal", {
      type: "layer.reorder",
      id: "time",
      placement: "forward",
    });
    expect(forward.design.elements[1].id).toBe("time");
  });

  it("resets the complete project instead of only the active mode", () => {
    const initial = defaultDesign();
    const edited = validateDesign({
      ...initial,
      name: "Edited",
      background: "#123456",
      layouts: {
        "low-battery": { background: "#000000", elements: [] },
      },
    });

    const result = executeEditorCommand(edited, "low-battery", {
      type: "project.reset",
      initialDesign: initial,
    });

    expect(result.design).toEqual(initial);
  });
});

import { describe, expect, it } from "vitest";
import { editorContextItems } from "../../../src/components/editor/model/context-menu";
import { defaultDesign, MAX_ELEMENTS } from "../../../src/watchface/schema";

describe("editor context menu", () => {
  it("offers paste on the canvas background only when clipboard space exists", () => {
    const design = defaultDesign();
    expect(editorContextItems(design, "background", false)).toEqual([
      expect.objectContaining({ action: "paste", disabled: true }),
    ]);
    expect(editorContextItems(design, "background", true)).toEqual([
      expect.objectContaining({ action: "paste", disabled: false }),
    ]);

    const full = {
      ...design,
      elements: Array.from({ length: MAX_ELEMENTS }, (_, index) => ({
        ...design.elements[0],
        id: `layer-${index}`,
      })),
    };
    expect(editorContextItems(full, "background", true)[0].disabled).toBe(true);
  });

  it("does not turn a removed layer target into a background menu", () => {
    expect(editorContextItems(defaultDesign(), "removed-layer", true)).toEqual(
      [],
    );
  });

  it("protects locked layers while leaving copy and unlock available", () => {
    const design = defaultDesign();
    const locked = {
      ...design,
      elements: design.elements.map((element) => ({
        ...element,
        locked: element.id === "time",
      })),
    };
    const items = editorContextItems(locked, "time", true);
    const state = Object.fromEntries(items.map((item) => [item.action, item]));

    expect(state.copy.disabled).toBeUndefined();
    expect(state.cut.disabled).toBe(true);
    expect(state.delete.disabled).toBe(true);
    expect(state["toggle-visibility"].disabled).toBe(true);
    expect(state["toggle-lock"].label).toBe("Unlock");
    expect(state["toggle-lock"].disabled).toBeUndefined();
  });

  it("disables arrange actions at the front and back boundaries", () => {
    const design = defaultDesign();
    const back = editorContextItems(design, design.elements[0].id, false);
    const front = editorContextItems(design, design.elements.at(-1)!.id, false);

    expect(back.find((item) => item.action === "send-backward")?.disabled).toBe(
      true,
    );
    expect(
      front.find((item) => item.action === "bring-forward")?.disabled,
    ).toBe(true);
  });

  it("labels actions for the complete selected group", () => {
    const design = defaultDesign();
    const selected = design.elements.slice(0, 2).map((element) => element.id);
    const items = editorContextItems(design, selected[0], true, selected);
    const labels = Object.fromEntries(
      items.map((item) => [item.action, item.label]),
    );

    expect(labels.copy).toBe("Copy 2 layers");
    expect(labels.duplicate).toBe("Duplicate 2 layers");
    expect(labels["bring-forward"]).toBe("Bring group forward");
    expect(labels.delete).toBe("Delete 2 layers");
  });
});

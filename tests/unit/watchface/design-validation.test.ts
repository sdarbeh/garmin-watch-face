import { describe, expect, it } from "vitest";
import {
  assertDesignExportable,
  designIssues,
} from "@/watchface/design-validation";
import {
  createElement,
  defaultDesign,
  presentation,
  validateDesign,
} from "@/watchface/schema";

describe("advanced design validation", () => {
  it("keeps the starter design free of false-positive warnings", () => {
    expect(designIssues(defaultDesign())).toEqual([]);
  });

  it("reports visible empty images as export blockers in their display mode", () => {
    const image = createElement("image", "photo");
    const design = validateDesign({
      ...defaultDesign(),
      elements: [image],
    });
    const issue = designIssues(design).find(
      (candidate) => candidate.id === "normal:photo:empty-image",
    );

    expect(issue).toMatchObject({
      severity: "error",
      mode: "normal",
      elementId: "photo",
    });
    expect(() => assertDesignExportable(design)).toThrow(
      "An image layer is empty",
    );
    expect(
      designIssues({
        ...design,
        elements: [{ ...image, visible: false }],
      }).some((candidate) => candidate.severity === "error"),
    ).toBe(false);
  });

  it("finds clipped and low-contrast layers with stable layer IDs", () => {
    const layer = {
      ...createElement("text", "edge-label"),
      text: "Hard to read",
      color: "#000000",
      x: 404,
      y: 404,
      size: 120 as const,
    };
    const issues = designIssues(
      validateDesign({ ...defaultDesign(), elements: [layer] }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "normal:edge-label:contrast",
          elementId: "edge-label",
        }),
        expect.objectContaining({
          id: "normal:edge-label:clipping",
          elementId: "edge-label",
        }),
      ]),
    );
  });

  it("checks custom always-on layouts against the luminance budget", () => {
    const shape = createElement("shape", "bright-shape");
    shape.presentation = {
      ...presentation(shape),
      variant: "circle",
      width: 300,
      height: 300,
    };
    const design = validateDesign({
      ...defaultDesign(),
      layouts: {
        "always-on": {
          background: "#000000",
          elements: [shape],
        },
      },
    });

    expect(designIssues(design)).toContainEqual(
      expect.objectContaining({
        id: "always-on:luminance",
        severity: "warning",
        mode: "always-on",
      }),
    );
  });
});

import { describe, expect, it } from "vitest";
import { fittedCanvasWidth } from "@/components/editor/hooks/useCanvasFit";

const frame = {
  presentationWidth: 400,
  frameWidth: 500,
  frameHeight: 600,
};

describe("canvas fitting", () => {
  it("keeps the intended presentation size when space allows", () => {
    expect(
      fittedCanvasWidth({
        ...frame,
        viewportWidth: 800,
        viewportHeight: 800,
      }),
    ).toBe(400);
  });

  it("fits a watch to a narrow canvas section", () => {
    expect(
      fittedCanvasWidth({
        ...frame,
        viewportWidth: 300,
        viewportHeight: 800,
      }),
    ).toBe(288);
  });

  it("also fits tall watch hardware within the available height", () => {
    expect(
      fittedCanvasWidth({
        ...frame,
        viewportWidth: 800,
        viewportHeight: 300,
      }),
    ).toBe(240);
  });
});

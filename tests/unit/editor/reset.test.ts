import { expect, it } from "vitest";
import { baseDesignForProject } from "@/components/editor/model/reset";
import { defaultDesign } from "@/watchface/schema";

it("clears a preset project to the blank canvas for its selected watch", () => {
  const design = defaultDesign("fenix847mm");
  design.background = "#123456";
  design.elements = [];
  const base = baseDesignForProject({ design });

  expect(base).toEqual({ ...defaultDesign(design.device), elements: [] });
});

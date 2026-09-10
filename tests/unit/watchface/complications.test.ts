import { expect, it } from "vitest";
import {
  complicationSample,
  supportsComplication,
} from "../../../src/watchface/complications";
import {
  createElement,
  defaultDesign,
  validateDesign,
} from "../../../src/watchface/schema";
import { renderModel, SAMPLE_DATA } from "../../../src/watchface/render-model";
import { generateProject } from "../../../src/watchface/generator";
import { complicationSources } from "../../../src/watchface/complication-runtime";
const layer = createElement("complication", "comp");
const design = { ...defaultDesign(), elements: [layer] };
it("converts documented Garmin units and preserves unavailable readings", () => {
  expect(
    complicationSample(
      { source: "recovery", showUnit: true, openOnHold: false },
      { recovery: 90 },
    ),
  ).toBe("1.5 h");
  expect(
    complicationSample(
      { source: "runDistance", showUnit: true, openOnHold: false },
      { runDistance: 26400 },
    ),
  ).toBe("26.4 km");
  expect(
    renderModel(design, {
      ...SAMPLE_DATA,
      complicationValues: { heartRate: null },
    })[0].sample,
  ).toBe("--");
  expect(
    complicationSample(
      { ...layer.complication!, source: "notifications" },
      { notifications: 0 },
    ),
  ).toBe("0");
});
it("validates sources, interactions and layer-specific settings", () => {
  expect(validateDesign(design).elements[0].complication).toEqual(
    layer.complication,
  );
  expect(() =>
    validateDesign({
      ...design,
      elements: [
        {
          ...layer,
          complication: { ...layer.complication, source: "user-supplied-code" },
        },
      ],
    }),
  ).toThrow(/complication/);
  expect(() =>
    validateDesign({ ...design, elements: [{ ...layer, type: "text" }] }),
  ).toThrow(/complication layer/);
  expect(
    supportsComplication({ capabilities: { complications: [] } }, "heartRate"),
  ).toBe(false);
});
it("subscribes once per source across modes and omits unused runtime", () => {
  const modes = {
    ...design,
    layouts: {
      night: { background: "#000000", elements: [{ ...layer, id: "other" }] },
    },
    night: { enabled: true, trigger: "dnd" as const, start: 0, end: 60 },
  };
  expect(complicationSources(modes)).toEqual(["heartRate"]);
  const output = generateProject(modes);
  expect(output["manifest.xml"]).toContain('id="ComplicationSubscriber"');
  expect(
    output["source/FaceApp.mc"].match(/subscribeToUpdates\(/g),
  ).toHaveLength(1);
  expect(output["source/FaceApp.mc"]).toContain("unsubscribeFromAllUpdates");
  expect(output["source/FaceApp.mc"]).toContain("complicationHits = []");
  expect(output["source/FaceApp.mc"]).toContain("getTextWidthInPixels");
  expect(output["source/FaceApp.mc"]).toContain("function onPress(event)");
  expect(
    generateProject({ ...defaultDesign(), onWatch: false })["manifest.xml"],
  ).not.toContain("ComplicationSubscriber");
  expect(
    generateProject({
      ...design,
      onWatch: false,
      elements: [{ ...layer, visible: false }],
    })["source/FaceApp.mc"],
  ).not.toContain("using Toybox.Complications");
});

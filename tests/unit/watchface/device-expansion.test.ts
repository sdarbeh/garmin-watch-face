import { expect, it } from "vitest";
import { chartLines, sampleHistory, CHART_SOURCES } from "@/watchface/charts";
import {
  createElement,
  defaultDesign,
  presentation,
  validateDesign,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { renderModel, SAMPLE_DATA } from "@/watchface/render-model";
import { supportedMetrics } from "@/watchface/capabilities";
import { devices } from "@/devices/catalog";
import { estimateAodLuminance } from "@/watchface/aod";
it("shares canonical values between complication formatting, rules and progress", () => {
  const e = createElement("runDistance", "distance");
  e.formatting = { units: "imperial", decimals: 1, prefix: "", suffix: "" };
  e.rules = [
    {
      source: "runDistance",
      comparison: "gte",
      threshold: 25,
      effect: "color",
      color: "#00FF00",
    },
  ];
  const d = { ...defaultDesign(), elements: [e] };
  const rendered = renderModel(d, { ...SAMPLE_DATA, runDistance: "30 km" })[0];
  expect(rendered.sample).toBe("18.6 mi");
  expect(rendered.color).toBe("#00FF00");
  e.presentation = { ...presentation(e), variant: "bar", goal: 60 };
  expect(
    renderModel(d, { ...SAMPLE_DATA, runDistance: "30 km" })[0].ratio,
  ).toBe(0.5);
  expect(generateProject(d)["source/FaceApp.mc"]).toContain(
    "readComplication(Complications.COMPLICATION_TYPE_WEEKLY_RUN_DISTANCE, 1000.0)",
  );
  expect(supportedMetrics(devices[0])).toContain("runDistance");
});
it("supports all history sources, zero readings and negative elevation", () => {
  for (const source of Object.keys(
    CHART_SOURCES,
  ) as (keyof typeof CHART_SOURCES)[]) {
    const e = {
      ...createElement("chart", "chart"),
      chart: { source, hours: 4 as const },
    };
    const d = validateDesign({ ...defaultDesign(), elements: [e] });
    expect(generateProject(d)["source/FaceApp.mc"]).toContain(
      CHART_SOURCES[source].method,
    );
    expect(
      sampleHistory("typical", source).every(
        (v) => v !== null && Number.isFinite(v),
      ),
    ).toBe(true);
  }
  expect(chartLines([0, 0, 0], 100, 100, 100, 50, false)).toHaveLength(1);
  expect(chartLines([-20, -10, 0], 100, 100, 100, 50, true)).toHaveLength(3);
});
it("exports native configuration with an explicit opt-out and standard metric hold targets", () => {
  const e = createElement("complication", "slot");
  const d = {
    ...defaultDesign(),
    onWatch: true,
    elements: [e, { ...createElement("steps", "steps"), openOnHold: true }],
  };
  const generated = generateProject(d);
  expect(generated["resources/watchface-config.xml"]).toContain(
    'default="true">Complications.COMPLICATION_TYPE_HEART_RATE',
  );
  expect(generated["source/FaceApp.mc"]).toContain("onWatchFaceConfigEdited");
  expect(generated["source/FaceApp.mc"]).toContain("addTextHit(dc, stepsText");
  expect(
    generateProject({ ...defaultDesign(), onWatch: false })[
      "resources/watchface-config.xml"
    ],
  ).toBeUndefined();
});
it("allows full-screen AOD editing and flags bright coverage conservatively", () => {
  const d = {
    ...defaultDesign(),
    elements: [
      {
        ...createElement("shape", "shape"),
        presentation: {
          ...presentation(createElement("shape", "s")),
          variant: "rectangle",
          width: 454,
          height: 454,
        },
      },
    ],
  };
  expect(estimateAodLuminance(d)).toBe(1);
  expect(
    validateDesign({
      ...defaultDesign(),
      layouts: {
        "always-on": {
          background: "#000000",
          elements: [{ ...createElement("time", "time"), x: 300, y: 300 }],
        },
      },
    }).layouts!["always-on"]!.elements[0].y,
  ).toBe(300);
});

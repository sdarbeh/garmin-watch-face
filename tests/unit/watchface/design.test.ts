import { describe, expect, it } from "vitest";
import {
  defaultDesign,
  parseProject,
  serializeProject,
  validateDesign,
} from "@/watchface/schema";
import { generateProject } from "@/watchface/generator";
import { renderModel } from "@/watchface/render-model";
import {
  BuildQueue,
  preflight,
  runProcess,
} from "../../../services/watchface/compiler";

describe("portable watchface project", () => {
  it("round trips every editable property without losing the design", () => {
    const design = defaultDesign();
    design.name = "My watch";
    design.background = "#00AAAA";
    for (const [i, element] of design.elements.entries())
      design.elements[i] = {
        ...element,
        x: 190 + i,
        y: 110 + i * 60,
        color: "#FFAA00",
        size: 64,
      };
    const storage = new Map<string, string>();
    storage.set("project", serializeProject(design));
    const reloaded = parseProject(storage.get("project")!);
    expect(parseProject(serializeProject(reloaded))).toEqual(design);
  });
  it("rejects unsupported versions, devices, injected code, missing fields and invalid numbers", () => {
    for (const change of [
      { version: 999 },
      { version: 2 },
      { version: 3 },
      { device: "fenix7" },
      { name: "<string>bad</string>" },
      { source: "System.exit();" },
      { elements: {} },
    ])
      expect(() => validateDesign({ ...defaultDesign(), ...change })).toThrow();
    for (const x of [NaN, Infinity, -1, 500, 99.5, "100"]) {
      const d = defaultDesign();
      Object.assign(
        d.elements.find((element) => element.type === "time")!,
        { x },
      );
      expect(() => validateDesign(d)).toThrow();
    }
    expect(() => parseProject(" ".repeat(1572865))).toThrow(/1.5 MB/);
    expect(() => parseProject("not a prg")).toThrow(/JSON/);
  });
  it("uses the same coordinates, colors, sizes and draw order in preview and source", () => {
    const design = { ...defaultDesign(), onWatch: false };
    Object.assign(
      design.elements.find((element) => element.type === "steps")!,
      { x: 211, y: 314, color: "#00AAAA", size: 120 },
    );
    const source = generateProject(design)["source/FaceApp.mc"];
    for (const element of renderModel(design)) {
      expect(source).toContain(
        `dc.drawText(${element.x}, ${element.y}, font_${element.font.key}, ${element.id}Text`,
      );
      expect(source).toContain(
        element.rules?.length
          ? `var ruleColor = 0x${element.color.slice(1)}`
          : `dc.setColor(0x${element.color.slice(1)}, Graphics.COLOR_TRANSPARENT)`,
      );
    }
    expect(generateProject(design)["manifest.xml"]).toContain(
      '<iq:product id="fr970"/>',
    );
    expect(source).toContain("var steps = info.steps");
    expect(source).toContain("System.getSystemStats().battery");
    expect(source).toContain("displayMode == System.DISPLAY_MODE_OFF");
    expect(source).toContain(
      "sleeping || displayMode == System.DISPLAY_MODE_LOW_POWER",
    );
  });
});
describe("compiler boundaries", () => {
  const config = {
    sdk: "",
    key: "",
    java: "/missing-java",
    repository: process.cwd(),
    timeoutMs: 100,
  };
  it("returns actionable errors instead of a fabricated artifact", async () => {
    expect((await preflight(config)).length).toBe(3);
    const queue = new BuildQueue(config);
    const first = queue.enqueue(defaultDesign());
    expect(first.state).toBe("queued");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(queue.get(first.id)?.result.state).toBe("failure");
    expect(queue.get(first.id)?.artifact).toBeUndefined();
    expect(queue.get(first.id)?.result.error).toContain("CIQ_SDK_HOME");
  });
  it("bounds pending builds and rejects unvalidated source", () => {
    const queue = new BuildQueue(config);
    for (let i = 0; i < 4; i++) queue.enqueue(defaultDesign());
    expect(() => queue.enqueue(defaultDesign())).toThrow(/queue is full/);
    expect(() => queue.enqueue({ source: "untrusted" })).toThrow();
  });
  it("kills stalled processes within the configured timeout", async () => {
    await expect(
      runProcess(
        process.execPath,
        ["-e", "setInterval(() => {}, 1000)"],
        process.cwd(),
        100,
      ),
    ).rejects.toThrow(/time limit/);
  });
  it("stops excessive compiler output", async () => {
    await expect(
      runProcess(
        process.execPath,
        ["-e", "process.stdout.write('x'.repeat(100000))"],
        process.cwd(),
        5000,
      ),
    ).rejects.toThrow(/64 KB/);
  });
});

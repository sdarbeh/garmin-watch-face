// Run against the real local service after configuration. No mock compiler.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const origin = "http://127.0.0.1:3000";
const base = "http://127.0.0.1:3000/api";
const starter = JSON.parse(
  await readFile(
    new URL("../../docs/watchface/starter.watchface.json", import.meta.url),
    "utf8",
  ),
);
const post = (data, sourceOrigin = origin) =>
  fetch(base + "/builds", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: sourceOrigin },
    body: typeof data === "string" ? data : JSON.stringify(data),
  });
assert.equal((await post(starter, "https://untrusted.example")).status, 403);
assert.equal(
  (await post({ ...starter, source: "untrusted source" })).status,
  400,
);
assert.equal((await post(" ".repeat(1572865))).status, 400);
assert.equal(
  (await fetch(base + "/builds/00000000-0000-0000-0000-000000000000/download"))
    .status,
  404,
);
const results = [];
for (const size of [
  "small",
  "medium",
  "large",
  "starter",
  "expanded",
  "modes",
  "metrics",
  "graphics",
].filter(
  (size) =>
    !process.env.WATCHFACE_FIXTURES ||
    process.env.WATCHFACE_FIXTURES.split(",").includes(size),
)) {
  const design = structuredClone(starter);
  if (!["starter", "expanded", "modes", "metrics", "graphics"].includes(size)) {
    for (const element of Object.values(design.elements))
      element.size = { small: 24, medium: 64, large: 120 }[size];
    design.elements.find((element) => element.type === "steps").color =
      "#00AAAA";
    design.elements.find((element) => element.type === "battery").x = 220;
  }
  if (size === "expanded") {
    design.elements.push({
      ...design.elements[0],
      id: "duplicate-time",
      locked: true,
    });
    design.elements.push({
      ...design.elements[1],
      id: "static-text",
      type: "text",
      text: 'Run "fast" \\ rest',
      y: 250,
    });
    design.elements[2].visible = false;
    const families = [
      "doto",
      "rubikbubbles",
      "pixelifysans",
      "anton",
      "robotocondensed",
      "garmin",
    ];
    design.elements.forEach((element, index) => {
      element.family = families[index];
      element.size = 48;
      element.weight =
        element.family === "doto" || element.family === "robotocondensed"
          ? 700
          : 400;
      element.alignment = index % 2 ? "left" : "right";
    });
    design.elements.reverse();
  }
  if (size === "modes") {
    const base = design.elements.find((e) => e.type === "time");
    design.layouts = {
      "always-on": {
        background: "#000000",
        elements: [
          {
            ...base,
            id: "aod-time",
            family: "doto",
            size: 32,
            x: 227,
            y: 151,
            color: "#777777",
          },
          { ...base, id: "aod-date", type: "date", size: 24, x: 227, y: 175 },
        ],
      },
      "low-battery": {
        background: "#000000",
        elements: [
          { ...base, id: "low-time", family: "rubikbubbles", size: 64 },
          { ...base, id: "low-steps", type: "steps", size: 32, y: 280 },
          {
            ...base,
            id: "low-label",
            type: "text",
            text: "Rest",
            family: "pixelifysans",
            size: 32,
            y: 330,
          },
        ],
      },
    };
  }
  if (size === "metrics") {
    const types = [
      "heartRate",
      "calories",
      "distance",
      "floors",
      "activeMinutes",
      "bodyBattery",
      "stress",
      "recovery",
      "weather",
    ];
    design.elements = types.map((type, index) => ({
      ...starter.elements[0],
      type,
      id: type,
      x: 227,
      y: 65 + index * 38,
      size: 24,
      family: "anton",
      weight: 400,
    }));
  }
  if (size === "graphics") {
    const sharp = (await import("sharp")).default;
    const png = await sharp({
      create: { width: 16, height: 16, channels: 4, background: "#ff8800" },
    })
      .png()
      .toBuffer();
    const choices = [
      ["progress", "ring"],
      ["progress", "bar"],
      ["shape", "circle"],
      ["shape", "rectangle"],
      ["shape", "arc"],
      ["shape", "line"],
      ["icon", "heart"],
      ["icon", "star"],
      ["icon", "battery"],
      ["icon", "steps"],
      ["icon", "sun"],
      ["image", "image"],
    ];
    design.elements = choices.map(([type, variant], index) => ({
      ...starter.elements[0],
      type,
      id: `graphic-${index}`,
      x: 115 + (index % 3) * 112,
      y: 90 + Math.floor(index / 3) * 90,
      size: 24,
      presentation: {
        variant,
        width: 64,
        height: 64,
        stroke: 3,
        source: "battery",
        goal: 100,
        image:
          type === "image"
            ? `data:image/png;base64,${png.toString("base64")}`
            : "",
      },
    }));
    design.layouts = {
      "low-battery": {
        background: design.background,
        elements: structuredClone(design.elements),
      },
    };
  }
  if (size === "metrics")
    design.layouts = {
      "low-battery": {
        background: design.background,
        elements: structuredClone(design.elements),
      },
    };
  const response = await post(design);
  assert.equal(response.status, 202);
  let job = await response.json();
  assert.equal(job.state, "queued");
  const deadline = Date.now() + 90000;
  while (["queued", "building"].includes(job.state) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    job = await (await fetch(base + `/builds/${job.id}`)).json();
  }
  assert.equal(job.state, "success", job.error);
  const download = await fetch(base + `/builds/${job.id}/download`);
  assert.equal(download.status, 200);
  const bytes = Buffer.from(await download.arrayBuffer());
  assert.equal(bytes.length, job.bytes);
  results.push({ size, ...job });
  if (
    ["starter", "expanded", "modes", "metrics", "graphics"].includes(size) &&
    process.env.WATCHFACE_ARTIFACT_DIR
  ) {
    await mkdir(process.env.WATCHFACE_ARTIFACT_DIR, { recursive: true });
    await writeFile(
      `${process.env.WATCHFACE_ARTIFACT_DIR}/${size}-fr970.prg`,
      bytes,
    );
    await writeFile(
      `${process.env.WATCHFACE_ARTIFACT_DIR}/${size}-build-report.json`,
      JSON.stringify(job, null, 2),
    );
  }
}
console.log(
  JSON.stringify(
    {
      status: "passed",
      boundaryChecks: 4,
      realCompilerBuilds: results.map(({ size, state, bytes, sha256 }) => ({
        size,
        state,
        bytes,
        sha256,
      })),
    },
    null,
    2,
  ),
);

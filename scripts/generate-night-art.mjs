import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const dim = (svg) =>
  svg.replace(
    /#[\da-f]{6}/gi,
    (hex) =>
      "#" +
      [1, 3, 5]
        .map((i) =>
          Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.34)
            .toString(16)
            .padStart(2, "0"),
        )
        .join(""),
  );
for (const name of [
  "summit",
  "starfield",
  "simple-dots",
  "race-circuit",
  "trail-dashboard",
]) {
  let svg = await readFile(`src/presets/assets/${name}.svg`, "utf8");
  if (name === "summit") {
    svg = svg.replace(
      /<circle cx="324" cy="70" r="12"[^>]*\/>/,
      '<path d="M327 53A17 17 0 1 0 341 81A19 19 0 0 1 327 53Z" fill="#D7E4EE"/>',
    );
    svg = svg.replace(
      "</svg>",
      '<g fill="#91AABE"><circle cx="105" cy="55" r="1.5"/><circle cx="253" cy="54" r="1"/><circle cx="372" cy="107" r="1.5"/></g></svg>',
    );
  }
  if (name === "simple-dots")
    svg = svg.replace("#F5F6F1", "#080D0A").replaceAll("#BCC2C0", "#34453C");
  else svg = dim(svg);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(`src/presets/assets/${name}-night.svg`, svg);
  await writeFile(
    `src/presets/assets/${name}-night.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}
const markers = Array.from(
  { length: 12 },
  (_, i) =>
    `<path transform="rotate(${i * 30} 227 227)" d="M227 31V51" stroke="#465C55" stroke-width="5"/>`,
).join("");
for (const name of ["panda", "heritage"]) {
  const rings =
    name === "panda"
      ? [
          [127, 259, 55],
          [327, 259, 55],
          [227, 344, 50],
        ]
          .map(
            ([x, y, r]) =>
              `<circle cx="${x}" cy="${y}" r="${r}" stroke="#34423E" stroke-width="2" fill="#0A100E"/>`,
          )
          .join("")
      : '<circle cx="227" cy="227" r="142" fill="none" stroke="#172A23"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 454 454"><circle cx="227" cy="227" r="224" fill="#060C09" stroke="#263C33"/>${markers}${rings}</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(
    `src/presets/assets/${name}-night.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const dotted = Array.from({ length: 37 }, (_, y) =>
  Array.from(
    { length: 37 },
    (_, x) =>
      `<circle cx="${11 + x * 12}" cy="${11 + y * 12}" r="0.7" fill="#BCC2C0"/>`,
  ).join(""),
).join("");
const flag = Array.from({ length: 4 }, (_, y) =>
  Array.from(
    { length: 6 },
    (_, x) =>
      `<rect x="${197 + x * 10}" y="${48 + y * 10}" width="10" height="10" fill="${(x + y) % 2 ? "#151515" : "#FFFFFF"}"/>`,
  ).join(""),
).join("");
const contours = Array.from(
  { length: 18 },
  (_, i) =>
    `<path d="M${-180 + i * 28} 0 Q${220 + i * 12} 80 ${15 + i * 23} 245 T${70 + i * 28} 454"/>`,
).join("");
const art = {
  "simple-dots": `<rect width="454" height="454" fill="#F5F6F1"/>${dotted}`,
  "race-circuit": `<rect width="454" height="454" fill="#07090B"/><g stroke="#1C2023" stroke-width="1">${[100, 160, 220, 280, 340].map((x) => `<path d="M${x} 72V382M72 ${x}H382"/>`).join("")}</g>${flag}<path d="M89 232 127 211Q137 205 150 218L176 243Q184 248 192 236L211 219Q222 211 233 222L257 243Q270 249 277 232L282 215Q286 206 298 209L350 213Q363 215 359 228L353 241Q349 248 337 243L319 235Q309 229 300 238L282 251Q269 260 252 253L224 242Q213 238 201 253L191 263Q181 271 167 258L137 231Q128 223 117 236L96 248Z" fill="none" stroke="#E8EBE9" stroke-width="3" stroke-linejoin="round"/>`,
  "trail-dashboard": `<rect width="454" height="454" fill="#0C2019"/><g fill="none" stroke="#395346" stroke-width="1.2">${contours}</g><circle cx="227" cy="227" r="214" fill="none" stroke="#264435" stroke-width="5"/><path d="M27 162A210 210 0 0 1 335 46" fill="none" stroke="#B5DD5D" stroke-width="5"/>${[
    [65, 209],
    [237, 209],
    [65, 290],
    [237, 290],
  ]
    .map(
      ([x, y]) =>
        `<rect x="${x}" y="${y}" width="152" height="77" rx="16" fill="#142E22"/>`,
    )
    .join("")}`,
};
for (const [name, body] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 454 454">${body}</svg>`;
  await writeFile(`src/presets/assets/${name}.svg`, svg);
  const png = await sharp(Buffer.from(svg))
    .png({ palette: true, colors: 128 })
    .toBuffer();
  await writeFile(
    `src/presets/assets/${name}.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}

for (const [source, name] of [
  ["lunar-crater", "lunar-dial"],
  ["lunar-crater-night", "lunar-night"],
]) {
  const png = await sharp(`src/presets/assets/${source}.png`)
    .resize(454, 454)
    .png({ palette: true, colors: 128 })
    .toBuffer();
  await writeFile(
    `src/presets/assets/${name}.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const art = {
  stars: `<g fill="#A6AEE6">${[
    [83, 120],
    [126, 70],
    [342, 105],
    [370, 195],
    [74, 279],
    [355, 332],
    [297, 53],
    [120, 368],
  ]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 2 : 3}"/>`)
    .join("")}</g>`,
  trail: `<g fill="none" stroke="#62774A" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M${-40 + i * 22} 0 Q${140 + i * 8} 85 ${40 + i * 23} 185 T${100 + i * 25} 454"/>`).join("")}</g>`,
  mountain:
    '<path d="M40 150 95 40 140 110 170 70 220 150Z M70 95 95 110 112 90" fill="none" stroke="#E2C98D" stroke-width="8"/>',
  moon: '<path d="M155 30A75 75 0 1 0 220 135A85 85 0 0 1 155 30" fill="#9A8AFF"/>',
  weather:
    '<circle cx="175" cy="70" r="35" fill="#FFD064"/><path d="M55 150C5 150 10 90 55 90C45 20 145 15 157 85C230 55 250 150 195 150Z" fill="#62CDF5"/>',
  runner:
    '<g fill="none" stroke="#FF343F" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="155" cy="35" r="12" fill="#FF343F"/><path d="M80 80 118 60 145 95 190 110 M130 78 110 137 65 145 30 194 M110 137 150 162 140 218"/></g>',
};
for (const [name, body] of Object.entries(art)) {
  const landscape = ["trail", "stars"].includes(name);
  const size = landscape ? 454 : 256;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${body}</svg>`;
  await writeFile(`src/presets/assets/${name}.svg`, svg);
  const png = await sharp(Buffer.from(svg))
    .resize(landscape ? 454 : 256)
    .png()
    .toBuffer();
  await writeFile(
    `src/presets/assets/${name}.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}

await import("./generate-themed-art.mjs");

await import("./generate-dial-art.mjs");

await import('./generate-night-art.mjs');

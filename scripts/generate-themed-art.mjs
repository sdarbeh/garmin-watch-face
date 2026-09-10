import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const stars = [
  [178, 63],
  [234, 41],
  [280, 70],
  [198, 99],
  [260, 108],
]
  .map(
    ([x, y]) =>
      `<path d="M${x - 3} ${y}h6M${x} ${y - 3}v6" stroke="#D2E8DF" stroke-width="2"/>`,
  )
  .join("");
const ticks = Array.from({ length: 60 }, (_, n) => {
  const a = (n * Math.PI) / 30;
  return `<path d="M${227 + Math.sin(a) * 185} ${227 - Math.cos(a) * 185}L${227 + Math.sin(a) * (n % 5 ? 180 : 174)} ${227 - Math.cos(a) * (n % 5 ? 180 : 174)}" stroke="#3E5354" stroke-width="${n % 5 ? 1 : 2}"/>`;
}).join("");
const art = {
  summit: `<rect width="454" height="454" fill="#080F14"/><path d="M0 0H454V195L377 170 343 184 270 119 235 139 176 61 99 159 49 174 0 208Z" fill="#59B7C1"/><circle cx="324" cy="70" r="12" fill="#E8E3B4"/><path d="M65 209 176 61 235 139 270 119 401 224Z" fill="#080F14"/><path d="M127 163 176 76 204 123 184 109 168 137 165 106Z M240 145 270 129 303 165 274 151 267 157Z" fill="#E2E7D0"/><path d="M64 322H390M98 373H356" stroke="#347EA7" stroke-width="3"/>`,
  starfield: `<rect width="454" height="454" fill="#080E13"/>${ticks}<circle cx="227" cy="88" r="54" fill="#19344B"/><path d="M180 115Q227 77 274 115L267 132H187Z" fill="#DAAB55"/><path d="M190 129Q227 100 265 129L253 139H201Z" fill="#C95545"/>${stars}${["#365F7D", "#CDA94E", "#D87542", "#B53940"].map((c, n) => `<path d="M12 ${194 + n * 12}H39M415 ${194 + n * 12}H442" stroke="${c}" stroke-width="12"/>`).join("")}`,
};
for (const [name, body] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 454 454">${body}</svg>`;
  await writeFile(`src/presets/assets/${name}.svg`, svg);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(
    `src/presets/assets/${name}.json`,
    JSON.stringify("data:image/png;base64," + png.toString("base64")) + "\n",
  );
}
const meme = await sharp(await readFile("src/presets/assets/this-is-fine.png"))
  .resize(454, 454)
  .png({ palette: true, colors: 128 })
  .toBuffer();
await writeFile(
  "src/presets/assets/this-is-fine.json",
  JSON.stringify("data:image/png;base64," + meme.toString("base64")) + "\n",
);

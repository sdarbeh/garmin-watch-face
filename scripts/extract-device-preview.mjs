import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const [, , source, destination] = process.argv;

if (!source || !destination) {
  throw new Error(
    "Usage: node scripts/extract-device-preview.mjs <source> <destination>",
  );
}

const image = sharp(await readFile(source)).removeAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
const pixelCount = info.width * info.height;
const exterior = new Uint8Array(pixelCount);
const queue = new Uint32Array(pixelCount);
let readIndex = 0;
let writeIndex = 0;

const isStudioMatte = (index) => {
  const offset = index * info.channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const lightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return darkest >= 205 && lightest - darkest <= 18;
};

const enqueue = (index) => {
  if (exterior[index] || !isStudioMatte(index)) return;
  exterior[index] = 1;
  queue[writeIndex++] = index;
};

for (let x = 0; x < info.width; x += 1) {
  enqueue(x);
  enqueue((info.height - 1) * info.width + x);
}
for (let y = 0; y < info.height; y += 1) {
  enqueue(y * info.width);
  enqueue(y * info.width + info.width - 1);
}

while (readIndex < writeIndex) {
  const index = queue[readIndex++];
  const x = index % info.width;
  const y = Math.floor(index / info.width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < info.width) enqueue(index + 1);
  if (y > 0) enqueue(index - info.width);
  if (y + 1 < info.height) enqueue(index + info.width);
}

const output = Buffer.alloc(pixelCount * 4);
for (let index = 0; index < pixelCount; index += 1) {
  const sourceOffset = index * info.channels;
  const outputOffset = index * 4;
  output[outputOffset] = data[sourceOffset];
  output[outputOffset + 1] = data[sourceOffset + 1];
  output[outputOffset + 2] = data[sourceOffset + 2];
  output[outputOffset + 3] = exterior[index] ? 0 : 255;
}

await sharp(output, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer()
  .then((result) => writeFile(destination, result));

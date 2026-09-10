import { getDeviceById } from "../../src/devices/catalog";
import sharp from "sharp";
import { usedImages } from "../../src/watchface/garmin-layers";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { usedFonts } from "../../src/watchface/generator";
import type { Design } from "../../src/watchface/schema";
export async function copyFontAssets(
  design: Design,
  directory: string,
  repository: string,
) {
  const device = getDeviceById(design.device)!;
  for (const image of usedImages(design)) {
    const output = await sharp(
      Buffer.from(image.image.split(",")[1], "base64"),
      { limitInputPixels: device.width * device.height },
    )
      .resize(image.width, image.height, {
        fit: "fill",
        kernel: image.pixelated ? "nearest" : "lanczos3",
      })
      .png()
      .toBuffer();
    await writeFile(join(directory, "resources", image.key + ".png"), output);
  }
  await mkdir(join(directory, "resources/fonts"), { recursive: true });
  for (const { key } of usedFonts(design)) {
    await copyFile(
      join(repository, "public/fonts/watchface", key + ".png"),
      join(directory, "resources/fonts", key + ".png"),
    );
  }
}

import { copyFontAssets } from "./font-assets";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateProject } from "../../src/watchface/generator";
import { parseProject } from "../../src/watchface/schema";
async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output)
    throw new Error(
      "Usage: npm run project:export -- design.watchface.json /new/output/directory",
    );
  const design = parseProject(await readFile(input, "utf8"));
  const files = generateProject(design);
  const directory = resolve(output);
  await mkdir(directory); // Refuse to overwrite an existing directory.
  for (const [file, source] of Object.entries(files)) {
    const path = resolve(directory, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, source, { flag: "wx" });
  }
  await copyFontAssets(design, directory, process.cwd());
  console.log(`Generated Forerunner 970 SDK project: ${directory}`);
}
void main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

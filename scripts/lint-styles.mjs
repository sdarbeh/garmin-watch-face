import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";

const SOURCE_ROOT = resolve(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([".scss", ".ts", ".tsx"]);

const readSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      const extension = extname(entry.name);

      if (entry.isDirectory()) return readSourceFiles(path);
      if (!SOURCE_EXTENSIONS.has(extension)) return [];

      return [{ extension, path, source: await readFile(path, "utf8") }];
    }),
  );

  return files.flat();
};

const getMatches = (value, pattern) =>
  new Set([...value.matchAll(pattern)].map((match) => match[1]));

const getAnimationNames = (value) => {
  const declarations = [
    ...value.matchAll(/animation(?:-name)?\s*:\s*([^;]+);/g),
  ];
  const names = declarations.flatMap(([, declaration]) => {
    const withoutFunctions = declaration.replace(
      /\b(?:cubic-bezier|steps|var)\([^)]*\)/g,
      "",
    );

    return withoutFunctions.split(",").map((animation) => {
      const [name] = animation.trim().split(/\s+/);

      return name;
    });
  });

  return new Set(names.filter((name) => name && name !== "none"));
};

const formatNames = (names) => [...names].sort().join(", ");
const files = await readSourceFiles(SOURCE_ROOT);
const source = files.map((file) => file.source).join("\n");
const styles = files
  .filter((file) => file.extension === ".scss")
  .map((file) => file.source)
  .join("\n");
const errors = [];

// Raw visual values belong in token definitions, not feature styles.
for (const file of files.filter(
  (file) =>
    file.extension === ".scss" &&
    /styles\/(components|pages)\//.test(file.path),
)) {
  if (/#[\da-f]{3,8}\b|\brgba?\(/i.test(file.source))
    errors.push(`${file.path}: use color tokens instead of literal colors.`);
  if (
    /\b(?:margin|padding|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:[^;{}]*\b\d*\.?\d+(?:px|rem)\b/.test(
      file.source,
    )
  )
    errors.push(`${file.path}: use spacing tokens instead of literal spacing.`);
}

const definedProperties = getMatches(source, /(--app-[\w-]+)\s*:/g);
const usedProperties = getMatches(source, /var\((--app-[\w-]+)/g);
const undefinedProperties = [...usedProperties].filter(
  (property) => !definedProperties.has(property),
);

if (undefinedProperties.length > 0) {
  errors.push(
    `Undefined application properties: ${formatNames(undefinedProperties)}`,
  );
}

const definedKeyframes = getMatches(styles, /@keyframes\s+([\w-]+)/g);
const usedKeyframes = getAnimationNames(styles);
const undefinedKeyframes = [...usedKeyframes].filter(
  (name) => !definedKeyframes.has(name),
);
const unusedKeyframes = [...definedKeyframes].filter(
  (name) => !usedKeyframes.has(name),
);

if (undefinedKeyframes.length > 0) {
  errors.push(`Undefined keyframes: ${formatNames(undefinedKeyframes)}`);
}

if (unusedKeyframes.length > 0) {
  errors.push(`Unused keyframes: ${formatNames(unusedKeyframes)}`);
}

const numericFontWeightFiles = files.filter(
  (file) =>
    file.extension === ".scss" && /font-weight:\s*\d+/.test(file.source),
);

if (numericFontWeightFiles.length > 0) {
  errors.push(
    `Numeric font weights bypass typography tokens: ${numericFontWeightFiles
      .map((file) => file.path.replace(`${process.cwd()}/`, ""))
      .sort()
      .join(", ")}`,
  );
}

if (errors.length > 0) {
  for (const error of errors) console.error(`Style lint: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Style contracts are valid.");
}

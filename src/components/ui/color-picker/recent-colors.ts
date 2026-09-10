const STORAGE_KEY = "watchface.recent-colors";
const LIMIT = 8;

export function normalizeRecentColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter(
          (color): color is string =>
            typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color),
        )
        .map((color) => color.toUpperCase()),
    ),
  ].slice(0, LIMIT);
}
export function readRecentColors(): string[] {
  try {
    return normalizeRecentColors(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"),
    );
  } catch {
    return [];
  }
}
export function rememberColor(color: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeRecentColors([color, ...readRecentColors()])),
    );
  } catch {
    /* Color selection still works when browser storage is unavailable. */
  }
}

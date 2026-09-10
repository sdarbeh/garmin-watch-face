import atlasData from "./font-metrics.json";
export const FONT_SIZES = [
  24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120,
] as const;
export const FONT_FAMILIES = {
  garmin: { name: "Garmin Native", weights: [400] },
  anton: { name: "Anton", weights: [400] },
  robotocondensed: { name: "Roboto Condensed", weights: [400, 700] },
  doto: { name: "Doto · Dot matrix", weights: [400, 700] },
  pixelifysans: { name: "Pixelify Sans · Pixel", weights: [400, 700] },
  rubikbubbles: { name: "Rubik Bubbles", weights: [400] },
} as const;
export type FontFamily = keyof typeof FONT_FAMILIES;
export type FontWeight = 400 | 700;
export type FontSize = (typeof FONT_SIZES)[number];
export type Alignment = "left" | "center" | "right";
// Alignment places text on the chosen side of its X reference point.
export const TEXT_PLACEMENT = {
  left: { centerOffset: -0.5, justification: "RIGHT" },
  center: { centerOffset: 0, justification: "CENTER" },
  right: { centerOffset: 0.5, justification: "LEFT" },
} as const;
export type Glyph = [number, number, number, number, number, number, number];
export interface FontMetrics {
  height: number;
  base: number;
  width: number;
  atlasHeight: number;
  glyphs: Record<string, Glyph>;
}
const metrics = atlasData as unknown as Record<string, FontMetrics>;
export function fontKey(element: {
  family: FontFamily;
  weight: FontWeight;
  size: FontSize;
}) {
  return `${element.family}_${element.weight}_${element.size}`;
}
export function fontMetrics(element: {
  family: FontFamily;
  weight: FontWeight;
  size: FontSize;
}) {
  return metrics[fontKey(element).replace("garmin_", "roboto_")];
}
export function textWidth(text: string, font: FontMetrics) {
  return [...text].reduce(
    (sum, char) =>
      sum + (font.glyphs[String(char.charCodeAt(0))] ?? font.glyphs["63"])[6],
    0,
  );
}
export function fontDescriptor(key: string, chars: string) {
  const f = metrics[key];
  const codes = [...new Set([...chars].map((char) => char.charCodeAt(0)))].sort(
    (a, b) => a - b,
  );
  return (
    `info face="${key}" size=${key.split("_").at(-1)} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=0,0\ncommon lineHeight=${f.height} base=${f.base} scaleW=${f.width} scaleH=${f.atlasHeight} pages=1 packed=0\npage id=0 file="${key}.png"\nchars count=${codes.length}\n` +
    codes
      .map((code) => {
        const [x, y, width, height, xoffset, yoffset, xadvance] =
          f.glyphs[String(code)];
        return `char id=${code} x=${x} y=${y} width=${width} height=${height} xoffset=${xoffset} yoffset=${yoffset} xadvance=${xadvance} page=0 chnl=15`;
      })
      .join("\n") +
    "\n"
  );
}

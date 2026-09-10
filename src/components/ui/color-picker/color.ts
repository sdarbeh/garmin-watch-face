export type HSV = { h: number; s: number; v: number };
export const clamp = (value: number, max = 100) =>
  Math.max(0, Math.min(max, value));
export function hexToHsv(hex: string): HSV {
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return {
    h: (h * 60 + 360) % 360,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}
export function hsvToHex({ h, s, v }: HSV) {
  const saturation = clamp(s) / 100;
  const value = clamp(v) / 100;
  const hue = ((h % 360) + 360) % 360;
  const channel = (n: number) => {
    const k = (n + hue / 60) % 6;
    return Math.round(
      (value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))) * 255,
    )
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`.toUpperCase();
}

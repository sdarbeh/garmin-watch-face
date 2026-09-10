import { presentation, type FaceElement } from "./schema";
type DialMark =
  | { kind: "disc"; x: number; y: number; radius: number; color: string }
  | {
      kind: "line";
      x: number;
      y: number;
      x2: number;
      y2: number;
      stroke: number;
      color: string;
    };
/** Chronograph dial geometry shared by browser SVG and Garmin drawing primitives. */
export function dialMarks(element: FaceElement): DialMark[] {
  const p = presentation(element);
  const scale = Math.min(p.width, p.height) / 454;
  const x = (n: number) => Math.round(element.x + (n - 227) * scale);
  const y = (n: number) => Math.round(element.y + (n - 227) * scale);
  const marks: DialMark[] = [];
  const disc = (cx: number, cy: number, r: number, color: string) =>
    marks.push({
      kind: "disc",
      x: x(cx),
      y: y(cy),
      radius: Math.round(r * scale),
      color,
    });
  const ticks = (
    cx: number,
    cy: number,
    radius: number,
    count: number,
    color: string,
  ) => {
    for (let n = 0; n < count; n++) {
      const angle = (n * Math.PI * 2) / count;
      const tickLength = n % 5 === 0 ? 17 : 7;
      const length = count === 60 ? tickLength : 6;
      marks.push({
        kind: "line",
        x: x(cx + Math.sin(angle) * radius),
        y: y(cy - Math.cos(angle) * radius),
        x2: x(cx + Math.sin(angle) * (radius - length)),
        y2: y(cy - Math.cos(angle) * (radius - length)),
        color,
        stroke: Math.max(
          1,
          Math.round((count === 60 && n % 5 === 0 ? 5 : 2) * scale),
        ),
      });
    }
  };
  if (p.variant === "field-dial") {
    disc(227, 227, 227, element.color);
    disc(227, 227, 204, "#C9D0C8");
    ticks(227, 227, 195, 60, "#707F7A");
    ticks(227, 227, 218, 60, "#A9B7AD");
    disc(227, 227, 143, "#B0BDB3");
    disc(227, 227, 141, "#C9D0C8");
    for (let n = 0; n < 12; n++) {
      if (n === 3) continue;
      const angle = (n * Math.PI) / 6;
      for (const [stroke, color] of [
        [18, element.color],
        [10, "#A4B8AC"],
      ] as const) {
        marks.push({
          kind: "line",
          x: x(227 + Math.sin(angle) * 178),
          y: y(227 - Math.cos(angle) * 178),
          x2: x(227 + Math.sin(angle) * 152),
          y2: y(227 - Math.cos(angle) * 152),
          stroke: Math.max(1, Math.round(stroke * scale)),
          color,
        });
      }
    }
    return marks;
  }
  disc(227, 227, 227, element.color);
  disc(227, 227, 200, "#B4B5AA");
  disc(227, 227, 197, "#F3EFE3");
  ticks(227, 227, 192, 60, element.color);
  ticks(227, 227, 218, 12, "#DDDCD3");
  for (const [cx, cy] of [
    [127, 258],
    [327, 258],
    [227, 343],
  ]) {
    disc(cx, cy, 56, "#959990");
    disc(cx, cy, 53, element.color);
    ticks(cx, cy, 50, 12, "#B3B7AE");
  }
  return marks;
}

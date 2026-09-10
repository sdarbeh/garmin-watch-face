import { chartLines, sampleHistory, type ChartPreview } from "./charts";
import { weatherIcon, WEATHER_LINES } from "./weather";
import { analogLines, isAnalog } from "./analog";
import { presentation, type FaceElement } from "./schema";
/** Normalized polylines are rendered identically by SVG and Monkey C. */
export function graphicLines(
  element: FaceElement & { sample?: string; chartPreview?: ChartPreview },
  ratio = 1,
): number[][][] {
  const p = presentation(element);
  if (element.type === "chart")
    return chartLines(
      sampleHistory(element.chartPreview ?? "typical", element.chart?.source),
      element.x,
      element.y,
      p.width,
      p.height,
      p.variant === "bar",
    );
  if (isAnalog(p.variant))
    return analogLines(element, element.sample ?? "00:00:00");
  const ellipse = (start = 0, sweep = Math.PI * 2) =>
    Array.from({ length: 65 }, (_, i) => [
      0.5 + Math.cos(start + (sweep * i) / 64) * 0.45,
      0.5 + Math.sin(start + (sweep * i) / 64) * 0.45,
    ]);
  let lines: number[][][];
  if (p.variant === "condition-icon") {
    const icon = weatherIcon(Number(element.sample ?? -1));

    lines = WEATHER_LINES[icon];
  } else if (p.variant === "ring")
    lines = [ellipse(-Math.PI / 2, Math.PI * 2 * ratio)];
  else if (p.variant === "bar")
    lines = [
      [
        [0, 0.5],
        [ratio, 0.5],
      ],
    ];
  else if (p.variant === "circle") lines = [ellipse()];
  else if (p.variant === "left-arc")
    lines = [ellipse(Math.PI * 0.76, Math.PI * 0.48)];
  else if (p.variant === "right-arc")
    lines = [ellipse(-Math.PI * 0.24, Math.PI * 0.48)];
  else if (p.variant === "arc") lines = [ellipse(-Math.PI, Math.PI)];
  else if (p.variant === "rectangle" || element.type === "image")
    lines = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ];
  else if (p.variant === "vertical-line")
    lines = [
      [
        [0.5, 0],
        [0.5, 1],
      ],
    ];
  else if (p.variant === "line")
    lines = [
      [
        [0, 0.5],
        [1, 0.5],
      ],
    ];
  else if (p.variant === "heart")
    lines = [
      [
        [0.5, 0.9],
        [0.1, 0.5],
        [0.05, 0.3],
        [0.15, 0.1],
        [0.35, 0.1],
        [0.5, 0.3],
        [0.65, 0.1],
        [0.85, 0.1],
        [0.95, 0.3],
        [0.9, 0.5],
        [0.5, 0.9],
      ],
    ];
  else if (p.variant === "battery")
    lines = [
      [
        [0.05, 0.25],
        [0.85, 0.25],
        [0.85, 0.75],
        [0.05, 0.75],
        [0.05, 0.25],
      ],
      [
        [0.95, 0.4],
        [0.95, 0.6],
      ],
    ];
  else if (p.variant === "steps")
    lines = [
      [
        [0.25, 0.1],
        [0.15, 0.4],
        [0.35, 0.45],
        [0.45, 0.15],
        [0.25, 0.1],
      ],
      [
        [0.6, 0.5],
        [0.5, 0.8],
        [0.7, 0.9],
        [0.8, 0.6],
        [0.6, 0.5],
      ],
    ];
  else if (p.variant === "star")
    lines = [
      Array.from({ length: 11 }, (_, i) => {
        const r = i % 2 ? 0.2 : 0.45;
        return [
          0.5 + Math.sin((i * Math.PI) / 5) * r,
          0.5 - Math.cos((i * Math.PI) / 5) * r,
        ];
      }),
    ];
  else {
    lines = [
      ellipse().map(([x, y]) => [0.5 + (x - 0.5) * 0.5, 0.5 + (y - 0.5) * 0.5]),
    ];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      lines.push(
        [0.34, 0.48].map((radius) => [
          0.5 + Math.cos(angle) * radius,
          0.5 + Math.sin(angle) * radius,
        ]),
      );
    }
  }
  const precision = p.variant === "condition-icon" ? 100 : 1;
  const coordinate = (value: number) =>
    Math.round(value * precision) / precision;
  return lines.map((line) =>
    line.map(([x, y]) => [
      coordinate(element.x + (x - 0.5) * p.width),
      coordinate(element.y + (y - 0.5) * p.height),
    ]),
  );
}

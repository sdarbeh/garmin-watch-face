/** Garmin condition codes grouped into compact icons shared by preview/export. */
export const WEATHER_CONDITIONS = [
  { label: "Clear", codes: [0, 23, 40], icon: "sun" },
  { label: "Partly cloudy", codes: [1, 22, 52], icon: "partly-cloudy" },
  { label: "Cloudy", codes: [2, 20], icon: "cloud" },
  {
    label: "Rain",
    codes: [3, 11, 13, 14, 15, 24, 25, 26, 27, 31, 45, 49],
    icon: "rain",
  },
  {
    label: "Snow",
    codes: [4, 7, 10, 16, 17, 18, 19, 21, 34, 43, 44, 46, 47, 48, 50, 51],
    icon: "snow",
  },
  { label: "Wind", codes: [5, 8, 9, 29, 30, 33, 35, 37, 38, 39], icon: "wind" },
  { label: "Storm", codes: [6, 12, 28, 32, 36, 41, 42], icon: "storm" },
] as const;
export function weatherIcon(code: number) {
  return (
    WEATHER_CONDITIONS.find((condition) =>
      (condition.codes as readonly number[]).includes(code),
    )?.icon ?? "unknown"
  );
}
type Point = [number, number];
/** Sample smooth cubic curves once; both renderers consume these same paths. */
function curve(a: Point, b: Point, c: Point, d: Point): number[][] {
  return Array.from({ length: 13 }, (_, i) => {
    const t = i / 12,
      u = 1 - t;
    return [0, 1].map(
      (axis) =>
        u ** 3 * a[axis] +
        3 * u ** 2 * t * b[axis] +
        3 * u * t ** 2 * c[axis] +
        t ** 3 * d[axis],
    );
  });
}
function arc(
  x: number,
  y: number,
  radius: number,
  start = 0,
  end = Math.PI * 2,
) {
  return Array.from({ length: 49 }, (_, i) => {
    const angle = start + ((end - start) * i) / 48;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
  });
}
const cloud = [
  ...curve([0.25, 0.64], [0.06, 0.64], [0.04, 0.39], [0.24, 0.37]),
  ...curve([0.24, 0.37], [0.25, 0.12], [0.63, 0.1], [0.69, 0.35]),
  ...curve([0.69, 0.35], [0.95, 0.29], [1, 0.64], [0.76, 0.64]),
  [0.25, 0.64],
];
const rays = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return [0.32, 0.43].map((r) => [
    0.5 + Math.cos(a) * r,
    0.5 + Math.sin(a) * r,
  ]);
});
export const WEATHER_LINES: Record<string, number[][][]> = {
  sun: [arc(0.5, 0.5, 0.21), ...rays],
  cloud: [cloud],
  "partly-cloudy": [
    arc(0.7, 0.28, 0.16, Math.PI * 0.96, Math.PI * 2.2),
    [
      [0.7, 0.01],
      [0.7, 0.065],
    ],
    [
      [0.91, 0.07],
      [0.86, 0.12],
    ],
    [
      [0.97, 0.28],
      [0.92, 0.28],
    ],
    cloud.map(([x, y]) => [x * 0.85, y * 0.85 + 0.2]),
  ],
  rain: [
    cloud,
    ...[0.3, 0.52, 0.74].map((x) => [
      [x, 0.75],
      [x - 0.06, 0.9],
    ]),
  ],
  snow: [
    cloud,
    ...[0.33, 0.69].flatMap((x) => [
      [
        [x, 0.75],
        [x, 0.93],
      ],
      [
        [x - 0.078, 0.795],
        [x + 0.078, 0.885],
      ],
      [
        [x - 0.078, 0.885],
        [x + 0.078, 0.795],
      ],
    ]),
  ],
  storm: [
    cloud,
    [
      [0.53, 0.7],
      [0.4, 0.83],
      [0.57, 0.83],
      [0.46, 0.96],
    ],
  ],
  wind: [
    [
      [0.1, 0.35],
      [0.64, 0.35],
      ...arc(0.64, 0.25, 0.1, Math.PI / 2, -Math.PI * 0.8),
    ],
    [
      [0.08, 0.52],
      [0.82, 0.52],
      ...arc(0.82, 0.42, 0.1, Math.PI / 2, -Math.PI * 0.8),
    ],
    [
      [0.2, 0.69],
      [0.6, 0.69],
      ...arc(0.6, 0.79, 0.1, -Math.PI / 2, Math.PI * 0.8),
    ],
  ],
  unknown: [
    [
      ...curve([0.34, 0.32], [0.34, 0.08], [0.76, 0.12], [0.66, 0.39]),
      ...curve([0.66, 0.39], [0.61, 0.51], [0.5, 0.45], [0.5, 0.65]),
    ],
    [
      [0.5, 0.8],
      [0.5, 0.83],
    ],
  ],
};

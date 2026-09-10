import { text as t, time, art, icon, shape, makePreset } from "./compose";
import { analogTime } from "../watchface/analog";
import { presentation } from "../watchface/schema";
import dots from "./assets/simple-dots.json";
import circuit from "./assets/race-circuit.json";
import trail from "./assets/trail-dashboard.json";
import lunar from "./assets/lunar-dial.json";
const variant = (element: ReturnType<typeof t>, value: string) => ({
  ...element,
  presentation: { ...presentation(element), variant: value },
});
const ink = "#15201B",
  lime = "#B5DD5D",
  white = "#DFE7DD";
export const simplePreset = makePreset(
  "simple",
  "Simple",
  "A light dotted dial, dot-matrix time, and a restrained monochrome dashboard.",
  [
    art(dots, 227, 227, 454),
    variant(t("weather", 139, 102, 32, ink), "temperature"),
    variant(t("battery", 315, 102, 32, ink), "percentage"),
    time(227, 194, 104, "doto", ink),
    variant(t("date", 227, 269, 24, ink), "full"),
    t("text", 145, 323, 24, ink, "STEPS"),
    t("text", 309, 323, 24, ink, "PULSE"),
    t("steps", 145, 365, 32, ink),
    t("heartRate", 309, 365, 32, ink),
    shape("vertical-line", 227, 344, 8, 76, "#8B9690", 1),
  ],
  "#AABDB0",
  "#F5F6F1",
);
export const racePreset = makePreset(
  "race-day",
  "Race Day",
  "Oversized red split time, a white circuit silhouette, and a checkered racing flag.",
  [
    art(circuit, 227, 227, 454),
    shape("left-arc", 227, 227, 432, 432, "#E92432", 7),
    shape("right-arc", 227, 227, 432, 432, "#6F151F", 3),
    variant(time(227, 151, 120, "anton", "#FF2639"), "hours"),
    variant(time(227, 313, 120, "anton", "#FF2639"), "minutes"),
    t("date", 227, 391, 24, "#CED3D4"),
  ],
  "#FF2639",
);
const trailCell = (
  type: Parameters<typeof t>[0],
  label: string,
  x: number,
  y: number,
) => [
  t("text", x, y, 24, lime, label, "robotocondensed"),
  t(type, x, y + 35, 32, white),
];
export const trailPreset = makePreset(
  "trail-data",
  "Trail Data",
  "Forest contours, lime accents, and a compact trail dashboard for steps, distance, calories, and stress.",
  [
    art(trail, 227, 227, 454),
    t("date", 227, 79, 32, white),
    time(227, 146, 96, "robotocondensed", white),
    ...trailCell("steps", "STEPS", 141, 229),
    ...trailCell("distance", "KM", 313, 229),
    ...trailCell("calories", "KCAL", 141, 310),
    ...trailCell("stress", "STRESS", 313, 310),
    icon("heart", 206, 396, lime, 24),
    t("heartRate", 255, 396, 24, white),
  ],
  lime,
  "#0C2019",
);
export const lunarPreset = makePreset(
  "lunar",
  "Lunar",
  "A quiet cratered lunar dial with luminous hands and no extra complications.",
  [
    art(lunar, 227, 227, 454),
    {
      ...analogTime(time(227, 227, 64, "garmin", "#B6FFDB"), 370),
      presentation: {
        ...presentation(analogTime(time(), 370)),
        variant: "analog",
        stroke: 4,
      },
    },
    shape("circle", 227, 227, 10, 10, "#B6FFDB", 5),
  ],
  "#B6FFDB",
  "#101720",
);

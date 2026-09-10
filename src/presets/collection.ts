import { racePreset, trailPreset, lunarPreset } from "./dials";
import { terminalPreset, starfieldPreset, finePreset } from "./themed";
import { analogTime } from "../watchface/analog";
import {
  text as t,
  time,
  shape as s,
  icon as i,
  progress as p,
  makePreset as face,
  palette as c,
} from "./compose";
import { presentation } from "../watchface/schema";
const weatherValue = (
  variant: string,
  x: number,
  y: number,
  size: Parameters<typeof t>[3],
) => {
  const e = t("weather", x, y, size);
  e.presentation = { ...presentation(e), variant };
  return e;
};
const weatherCondition = () => {
  const e = weatherValue("condition-icon", 321, 98, 24);
  e.color = c.blue;
  e.presentation = { ...presentation(e), width: 48, height: 48, stroke: 3 };
  return e;
};
const wellnessHistory = () => {
  const e = t("chart", 227, 272, 24, c.violet);
  e.presentation = {
    ...presentation(e),
    variant: "bar",
    width: 240,
    height: 56,
    stroke: 4,
  };
  return e;
};
const rule = (y: number, color = c.track) => s("line", 227, y, 300, 8, color);
const vertical = (x = 227, y = 250, height = 150, color = c.track) =>
  s("vertical-line", x, y, 8, height, color, 2);
const part = (variant: "hours" | "minutes", y: number, color: string) => {
  const e = time(163, y, 120, "anton", color);
  e.presentation = { ...presentation(e), variant };
  return e;
};
export const collectionPresets = [
  face(
    "numerals",
    "Numerals",
    "Oversized cream and cyan time, with steps, heart rate, and temperature alongside.",
    [
      part("hours", 136, "#FFF1D6"),
      part("minutes", 276, c.blue),
      vertical(262, 221, 260, "#5275B0"),
      i("steps", 292, 139, c.blue, 24),
      t("steps", 347, 139, 32),
      i("heart", 292, 222, c.blue, 24),
      t("heartRate", 347, 222, 32),
      i("sun", 292, 305, c.gold, 24),
      t("weather", 347, 305, 32),
      t("date", 227, 372, 24, "#C7DBFF"),
    ],
    c.blue,
    "#123C91",
  ),
  face(
    "panda",
    "Panda",
    "An ivory racing dial with a dark bezel and three live subdials for steps, pulse, and battery.",
    [
      s("dial", 227, 227, 454, 454, "#191E21"),
      t("text", 227, 83, 24, "#292B2A", "PANDA", "robotocondensed"),
      t("date", 227, 132, 24, "#56564F"),
      t("text", 127, 242, 24, "#C5C8C5", "STEPS", "robotocondensed"),
      t("steps", 127, 274, 24),
      t("text", 327, 242, 24, "#C5C8C5", "BPM", "robotocondensed"),
      t("heartRate", 327, 274, 24),
      t("text", 227, 327, 24, "#C5C8C5", "BATT", "robotocondensed"),
      t("battery", 227, 359, 24),
      analogTime(time(227, 227, 64, "robotocondensed", "#8C6630"), 360),
    ],
    "#D8CBB0",
    "#F3EFE3",
  ),
  face(
    "weather-desk",
    "Weather Desk",
    "Live weather conditions, current temperature, daily high and low, sunrise, and sunset in a clear four-section dashboard.",
    [
      vertical(227, 227, 310, "#35424A"),
      rule(227, "#35424A"),
      t("text", 133, 105, 24, c.muted, "TIME"),
      weatherCondition(),
      time(133, 158, 56),
      weatherValue("temperature", 321, 158, 56),
      weatherValue("high", 279, 196, 24),
      weatherValue("low", 363, 196, 24),
      t("text", 133, 274, 24, c.muted, "SUNRISE"),
      t("text", 321, 274, 24, c.muted, "SUNSET"),
      weatherValue("sunrise", 133, 326, 48),
      weatherValue("sunset", 321, 326, 48),
    ],
    c.blue,
  ),
  terminalPreset,
  trailPreset,
  face(
    "wellness",
    "Wellness",
    "Lavender and peach on deep plum, with Body Battery, four-hour heart-rate history, stress, and recovery.",
    [
      s("circle", 227, 227, 424, 424, "#64466B", 10),
      p("bodyBattery", 227, 227, 424, c.violet, 100, "ring"),
      t("text", 227, 123, 24, c.violet, "BODY BATTERY"),
      t("bodyBattery", 227, 169, 64, c.white, "", "anton"),
      wellnessHistory(),
      t("recovery", 147, 350, 40, c.white),
      t("stress", 307, 350, 40, "#FFC2A4"),
    ],
    c.violet,
    "#38233F",
  ),
  lunarPreset,
  racePreset,
  starfieldPreset,
  finePreset,
];

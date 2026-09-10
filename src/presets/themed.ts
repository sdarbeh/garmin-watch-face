import { text as t, time, art, icon, progress, makePreset } from "./compose";
import { presentation } from "../watchface/schema";
import summit from "./assets/summit.json";
import starfield from "./assets/starfield.json";
import fine from "./assets/this-is-fine.json";
const mint = "#B9E3CE";
const terminalRow = (
  type: Parameters<typeof t>[0],
  label: string,
  y: number,
) => [
  {
    ...t("text", 100, y, 32, "#61B987", label, "pixelifysans"),
    alignment: "right" as const,
  },
  {
    ...t(type, 205, y, 32, "#AFFFC4", "", "pixelifysans"),
    alignment: "right" as const,
  },
];
export const terminalPreset = makePreset(
  "terminal",
  "Terminal",
  "A mint-green command prompt, oversized pixel clock, and a tidy live status readout.",
  [
    t("text", 227, 90, 24, "#43ED81", "~$ status", "pixelifysans"),
    time(227, 155, 88, "pixelifysans", "#43ED81"),
    ...terminalRow("date", "DATE", 220),
    ...terminalRow("battery", "BAT", 257),
    ...terminalRow("steps", "STEP", 294),
    ...terminalRow("heartRate", "HR", 331),
    ...terminalRow("weather", "TEMP", 368),
  ],
  "#43ED81",
);
export const starfieldPreset = makePreset(
  "starfield",
  "Starfield",
  "A retro mission dial with a planetary crest, muted mint numerals, and warm spectrum accents.",
  [
    art(starfield, 227, 227, 454),
    t("text", 227, 162, 24, mint, "INTO THE STARFIELD", "pixelifysans"),
    time(227, 224, 80, "pixelifysans", mint),
    t("date", 227, 282, 24, mint, "", "pixelifysans"),
    progress("steps", 227, 332, 230, mint, 10000),
    t("steps", 227, 365, 32, mint, "", "pixelifysans"),
  ],
  mint,
);
export const finePreset = makePreset(
  "this-is-fine",
  "This Is Fine",
  "A very calm coffee break in a very warm room. Your live clock sits in the speech bubble.",
  [
    art(fine, 227, 227, 454),
    t("text", 232, 63, 24, "#242424", "THIS IS FINE", "pixelifysans"),
    time(232, 108, 64, "pixelifysans", "#242424"),
    icon("steps", 151, 376, "#FFFFFF", 22),
    icon("heart", 303, 376, "#FF9381", 22),
    t("steps", 151, 403, 24),
    t("heartRate", 303, 403, 24),
  ],
  "#F3B853",
);
export const summitPreset = makePreset(
  "summit",
  "Summit",
  "An alpine silhouette against a glacial sky, with bold time and compact daily metrics.",
  [
    art(summit, 227, 227, 454),
    time(227, 239, 88, "anton", "#E2E7D0"),
    t("date", 227, 299, 24, "#E2E7D0"),
    t("text", 129, 342, 24, "#72B9DC", "STEPS", "robotocondensed"),
    t("text", 227, 342, 24, "#72B9DC", "BPM", "robotocondensed"),
    t("text", 325, 342, 24, "#72B9DC", "KCAL", "robotocondensed"),
    t("steps", 129, 364, 24, "#E2E7D0"),
    t("heartRate", 227, 364, 24, "#E2E7D0"),
    t("calories", 325, 364, 24, "#E2E7D0"),
    progress("battery", 227, 399, 146, "#72B9DC", 100),
  ],
  "#72B9DC",
);
// Keep low-power art-free, with the same font and a recognizable theme caption.
for (const preset of [
  terminalPreset,
  starfieldPreset,
  finePreset,
  summitPreset,
]) {
  const caption: Record<string, string> = {
    "this-is-fine": "STILL FINE",
    terminal: "~$ sleep",
    starfield: "DEEP SPACE",
    summit: "AFTER THE SUMMIT",
  };
  const clock = preset.design.layouts!.night!.elements.find(
    (e) => e.type === "time",
  )!;
  preset.design.layouts!.night!.elements[0] = t(
    "text",
    227,
    132,
    24,
    clock.color,
    caption[preset.slug],
    clock.family === "anton" ? "garmin" : clock.family,
  );
  if (preset.slug === "terminal") {
    const battery = preset.design.elements.find((e) => e.type === "battery")!;
    battery.presentation = { ...presentation(battery), variant: "percentage" };
  }
}

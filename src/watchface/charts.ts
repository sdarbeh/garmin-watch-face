/** Sensor history sources supported by the Forerunner 970. */
export const CHART_SOURCES = {
  heartRate: {
    label: "Heart rate",
    unit: "bpm",
    method: "getHeartRateHistory",
    min: 1,
    max: 254,
    sample: 68,
  },
  bodyBattery: {
    label: "Body Battery",
    unit: "%",
    method: "getBodyBatteryHistory",
    min: 0,
    max: 100,
    sample: 74,
  },
  stress: {
    label: "Stress",
    unit: "",
    method: "getStressHistory",
    min: 0,
    max: 100,
    sample: 24,
  },
  oxygen: {
    label: "Pulse Ox",
    unit: "%",
    method: "getOxygenSaturationHistory",
    min: 1,
    max: 100,
    sample: 96,
  },
  elevation: {
    label: "Elevation",
    unit: "m",
    method: "getElevationHistory",
    min: -500,
    max: 10000,
    sample: 420,
  },
  pressure: {
    label: "Pressure",
    unit: "Pa",
    method: "getPressureHistory",
    min: 1,
    max: 120000,
    sample: 101325,
  },
  temperature: {
    label: "Sensor temperature",
    unit: "C",
    method: "getTemperatureHistory",
    min: -100,
    max: 100,
    sample: 26,
  },
} as const;
export type ChartSource = keyof typeof CHART_SOURCES;
export const CHART_RANGES = [1, 4, 12, 24] as const;
export interface ChartSettings {
  source?: ChartSource;
  hours: (typeof CHART_RANGES)[number];
}
export const CHART_POINTS = 32;
export type ChartPreview = "typical" | "gaps" | "empty";
export function sampleHistory(
  preview: ChartPreview,
  source: ChartSource = "heartRate",
): (number | null)[] {
  return Array.from({ length: CHART_POINTS }, (_, i) => {
    if (preview === "empty" || (preview === "gaps" && i >= 12 && i <= 17))
      return null;
    const profile = CHART_SOURCES[source];
    return Math.max(
      profile.min,
      Math.min(
        profile.max,
        Math.round(
          profile.sample +
            Math.sin(i * 0.55) * 9 +
            Math.max(0, Math.sin(i * 0.19)) * 36,
        ),
      ),
    );
  });
}
export function chartLines(
  values: (number | null)[],
  x: number,
  y: number,
  width: number,
  height: number,
  bars: boolean,
): number[][][] {
  const valid = values.filter(
    (n): n is number => n !== null && Number.isFinite(n),
  );
  if (!valid.length) return [];
  const low = bars ? Math.min(0, ...valid) : Math.min(...valid) - 5;
  const high = Math.max(...valid) + 5;
  const result: number[][][] = [];
  let segment: number[][] = [];
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      segment = [];
      return;
    }
    const px = x - width / 2 + (index * width) / (values.length - 1);
    const py = y + height / 2 - ((value - low) / (high - low)) * height;
    if (bars)
      result.push([
        [px, y + height / 2],
        [px, py],
      ]);
    else {
      if (!segment.length) {
        segment = [];
        result.push(segment);
      }
      segment.push([px, py]);
    }
  });
  return result.filter((line) => line.length > 1);
}
export const chartMethods = `
    var chartCache = {};
    function drawHistory(dc, x, y, width, height, hours, bars, source) {
        var minute = Time.now().value() / 60;
        var key = source + ":" + hours;
        var cached = chartCache[key];
        if (cached == null || cached[0] != minute) {
            var values = new [32];
            var now = Time.now().value();
            var span = hours * 3600;
            var iterator = null;
            ${Object.entries(CHART_SOURCES)
              .map(
                ([key, profile]) =>
                  `if (source.equals("${key}") && SensorHistory has :${profile.method}) { iterator = SensorHistory.${profile.method}({:period => new Time.Duration(span), :order => SensorHistory.ORDER_NEWEST_FIRST}); }`,
              )
              .join("\n            ")}
            var minimum = -1000000; var maximum = 1000000;
            ${Object.entries(CHART_SOURCES)
              .map(
                ([key, profile]) =>
                  `if (source.equals("${key}")) { minimum = ${profile.min}; maximum = ${profile.max}; }`,
              )
              .join("\n            ")}
            if (iterator != null) {
                var sample = iterator.next();
                var count = 0;
                while (sample != null && count < 4096) {
                    var age = now - sample.when.value();
                    var index = 31 - Math.floor(age.toFloat() / span * 32).toNumber();
                    if (index >= 0 && index < 32 && values[index] == null && sample.data != null && sample.data >= minimum && sample.data <= maximum) { values[index] = sample.data; }
                    sample = iterator.next(); count += 1;
                }
            }
            cached = [minute, values]; chartCache[key] = cached;
        }
        var points = cached[1];
        var low = 1000000.0; var high = -1000000.0; var found = false;
        for (var i = 0; i < 32; i += 1) { if (points[i] != null) { found = true; if (points[i] < low) { low = points[i]; } if (points[i] > high) { high = points[i]; } } }
        if (!found) { return; }
        low = bars ? (low < 0 ? low : 0) : low - 5; high += 5;
        var previousX = 0.0; var previousY = 0.0; var hasPrevious = false;
        for (var j = 0; j < 32; j += 1) {
            if (points[j] == null) { hasPrevious = false; continue; }
            var px = x - width/2.0 + j*width/31.0;
            var py = y + height/2.0 - (points[j]-low)/(high-low)*height;
            if (bars) { dc.drawLine(px, y+height/2.0, px, py); }
            else if (hasPrevious) { dc.drawLine(previousX, previousY, px, py); }
            previousX = px; previousY = py; hasPrevious = true;
        }
    }
`;

import type { Metric } from "./layer-catalog";
/** Monkey C bindings. Steps and battery are initialized by the shared runtime.
 * Missing readings remain null; text renders -- and progress renders empty.
 * Preview values and units are defined once in layer-catalog.ts.
 */
export const METRIC_SOURCES: Partial<Record<Metric, string>> = {
  calories: "var calories = info.calories;",
  distance:
    "var distance = info.distance == null ? null : info.distance / 100000.0;",
  floors: "var floors = info.floorsClimbed;",
  activeMinutes:
    "var activeMinutes = info.activeMinutesDay == null ? null : info.activeMinutesDay.total;",
  stress:
    "var stress = info has :stressScore ? info.stressScore : null; if (stress != null && stress < 0) { stress = null; }",
  recovery:
    "var recovery = info has :timeToRecovery ? info.timeToRecovery : null;",
  heartRate:
    "var heartSample = SensorHistory.getHeartRateHistory({:period => 1}).next(); var heartRate = heartSample == null ? null : heartSample.data; if (heartRate != null && heartRate <= 0) { heartRate = null; }",
  bodyBattery:
    "var bodySample = SensorHistory.getBodyBatteryHistory({:period => 1}).next(); var bodyBattery = bodySample == null ? null : bodySample.data; if (bodyBattery != null && bodyBattery < 0) { bodyBattery = null; }",
  weather:
    "var conditions = Weather.getCurrentConditions(); var weather = conditions == null ? null : conditions.temperature;",
};
export const METRIC_PERMISSIONS: Partial<Record<Metric, readonly string[]>> = {
  heartRate: ["SensorHistory"],
  bodyBattery: ["SensorHistory"],
};
export function dataPermissions(
  metrics: Iterable<Metric>,
  solarTimes: boolean,
) {
  const permissions = new Set(
    [...metrics].flatMap((metric) => METRIC_PERMISSIONS[metric] ?? []),
  );
  if (solarTimes) permissions.add("Positioning");
  return [...permissions];
}

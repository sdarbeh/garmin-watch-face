import { presentation } from "./schema";
import { getDeviceById } from "../devices/catalog";
import { createElement, type Design } from "./schema";
export type PowerMode = "normal" | "always-on" | "low-battery" | "night";
export function lowBatteryThreshold(design: Design) {
  return (
    design.power?.lowBatteryThreshold ??
    getDeviceById(design.device)!.power.defaultLowBatteryThreshold
  );
}
export function isNightActive(design: Design, minutes: number, dnd = false) {
  const settings = design.night;
  if (!settings?.enabled) return false;
  if (settings.trigger === "dnd") return dnd;
  return settings.start < settings.end
    ? minutes >= settings.start && minutes < settings.end
    : minutes >= settings.start || minutes < settings.end;
}
export function resolvePowerMode(
  design: Design,
  mode: PowerMode,
  battery: number,
  minutes = 0,
  dnd = false,
): PowerMode {
  if (mode !== "normal") return mode;
  if (
    getDeviceById(design.device)!.capabilities.lowBattery &&
    battery <= lowBatteryThreshold(design)
  )
    return "low-battery";
  return isNightActive(design, minutes, dnd) ? "night" : "normal";
}
export function compilationLayouts(design: Design): Design[] {
  return [
    design,
    powerLayout(design, "always-on"),
    powerLayout(design, "low-battery"),
    ...(design.night?.enabled ? [powerLayout(design, "night")] : []),
  ];
}
export function powerLayout(
  design: Design,
  mode: PowerMode,
  minute = 0,
): Design {
  const device = getDeviceById(design.device)!;
  if (mode === "normal") return design;
  const saved = design.layouts?.[mode];
  if (saved)
    return {
      ...design,
      ...saved,
      elements: saved.elements.map((e) => ({
        ...e,
        ...(mode === "always-on" && presentation(e).variant === "analog-seconds"
          ? { presentation: { ...presentation(e), variant: "analog" } }
          : {}),
        y:
          e.y +
          (mode === "always-on"
            ? (minute % 2) * device.power.alwaysOn.shiftY
            : 0),
      })),
    };
  if (mode === "always-on" && !device.capabilities.alwaysOn)
    return { ...design, background: "#000000", elements: [] };
  if (mode === "low-battery" && !device.capabilities.lowBattery) return design;
  const format =
    design.elements.find((e) => e.type === "time" && e.visible)?.timeFormat ??
    createElement("time", "power-time").timeFormat;
  const time = {
    ...createElement("time", "power-time"),
    timeFormat: format,
    x: device.width / 2,
    locked: false,
  };
  if (mode === "night")
    return {
      ...design,
      background: "#000000",
      elements: [
        {
          ...time,
          family:
            design.elements.find((e) => e.type === "time")?.family ?? "garmin",
          size: 64,
          color: "#777777",
          y: device.height / 2,
        },
      ],
    };
  if (mode === "always-on") {
    const aod = device.power.alwaysOn;
    return {
      ...design,
      background: "#000000",
      elements: [
        {
          ...time,
          size: aod.fontSize,
          color: aod.color,
          x: aod.centerX,
          y: aod.centerY + (minute % 2) * aod.shiftY,
        },
      ],
    };
  }
  return {
    ...design,
    background: "#000000",
    elements: [
      { ...time, size: 80, color: "#AAAAAA", y: 200 },
      {
        ...createElement("battery", "power-battery"),
        size: 32,
        color: "#777777",
        y: 280,
        locked: false,
      },
    ],
  };
}

/** Editor adapters keep every existing layer tool scoped to the active layout. */
export function updateModeLayout(
  project: Design,
  mode: PowerMode,
  edited: Design,
): Design {
  if (mode === "normal") return edited;
  return {
    ...project,
    ...(edited.onWatch !== undefined ? { onWatch: edited.onWatch } : {}),
    ...(edited.power ? { power: edited.power } : {}),
    ...(edited.night ? { night: edited.night } : {}),
    layouts: {
      ...project.layouts,
      [mode]: {
        background: mode === "always-on" ? "#000000" : edited.background,
        elements: edited.elements,
      },
    },
  };
}

/** Remove a mode override so the editor falls back to its inherited layout. */
export function resetModeLayout(project: Design, mode: PowerMode): Design {
  if (mode === "normal" || !project.layouts?.[mode]) return project;
  const remaining: NonNullable<Design["layouts"]> = { ...project.layouts };
  delete remaining[mode];
  if (Object.keys(remaining).length > 0)
    return { ...project, layouts: remaining };
  const reset: Design = { ...project };
  delete reset.layouts;
  return reset;
}

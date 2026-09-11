import { STATUS_SOURCES, type StatusSource } from "./status-sources";
import {
  watchSlots,
  watchConfigResource,
  watchConfigMethods,
  watchConfigDelegate,
} from "./on-watch";
import { conversion, defaultFormat, metricUnit } from "./formatting";
import { COMPLICATIONS, isComplicationSource } from "./complications";
import {
  complicationSources,
  complicationLifecycle,
  complicationMethods,
  complicationDelegate,
} from "./complication-runtime";
import { chartMethods } from "./charts";
import { conditionalDraw } from "./rules";
import { dataPermissions } from "./data-sources";
import {
  usedImages,
  requiredMetrics,
  drawGraphic,
  metricText,
  metricSource,
  graphicMethods,
} from "./garmin-layers";
import { isGraphic } from "./layer-catalog";
import { presentation } from "./schema";
import { getDeviceById } from "../devices/catalog";
import { compilationLayouts, lowBatteryThreshold, powerLayout } from "./power";
import { fontDescriptor, TEXT_PLACEMENT } from "./fonts";
import { validateDesign, type Design } from "./schema";
import { renderModel } from "./render-model";
import { assertDesignExportable } from "./design-validation";
const hex = (color: string) => `0x${color.slice(1)}`;
/** Only validated literals enter source. No uploaded code, paths, or templates. */
export function generateProject(input: Design): Record<string, string> {
  const design = validateDesign(input);
  assertDesignExportable(design);
  const device = getDeviceById(design.device)!;
  const hasComplications =
    complicationSources(design).length > 0 ||
    Boolean(design.onWatch) ||
    compilationLayouts(design).some((layout) =>
      layout.elements.some((e) => e.visible && e.type === "status"),
    );
  const slots = watchSlots(design);
  const aod = device.power.alwaysOn;
  const alwaysOn = powerLayout(design, "always-on");
  const lowBattery = powerLayout(design, "low-battery");
  const night = powerLayout(design, "night");
  let nightCondition = "false";
  if (design.night?.enabled) {
    const n = design.night;
    const join = n.start < n.end ? "&&" : "||";
    nightCondition =
      n.trigger === "dnd"
        ? "(settings has :doNotDisturb) && settings.doNotDisturb"
        : `minuteOfDay >= ${n.start} ${join} minuteOfDay < ${n.end}`;
  }
  const fonts = usedFonts(design);
  const images = usedImages(design);
  const nativeFonts = [
    ...new Map(
      [
        ...renderModel(design, undefined, false),
        ...(device.capabilities.alwaysOn
          ? renderModel(alwaysOn, undefined, false)
          : []),
        ...(device.capabilities.lowBattery
          ? renderModel(lowBattery, undefined, false)
          : []),
        ...(design.night?.enabled ? renderModel(night, undefined, false) : []),
      ]
        .filter(
          (e) =>
            e.family === "garmin" &&
            !isGraphic(e.type, presentation(e).variant),
        )
        .map((e) => [e.font.key, e]),
    ).values(),
  ];
  const resources: Record<string, string> = {
    "resources/fonts/fonts.xml":
      "<fonts>" +
      fonts
        .map(({ key }) => `<font id="${key}" filename="${key}.fnt" />`)
        .join("") +
      "</fonts>\n",
  };
  for (const font of fonts)
    resources[`resources/fonts/${font.key}.fnt`] = fontDescriptor(
      font.key,
      font.chars,
    );
  const draw = (layout: Design, shift = false) =>
    renderModel(layout, undefined, false)
      .map((e) => {
        const baseExpression =
          design.onWatch && !shift
            ? `configurationColor(${hex(e.color)}, ${e.type === "time"})`
            : hex(e.color);
        if (e.complication && !isGraphic(e.type, presentation(e).variant)) {
          const c = e.complication;
          const source = COMPLICATIONS[c.source];
          const f = e.formatting ?? {
            ...defaultFormat(c.source),
            decimals: source.decimals,
          };
          const converted = conversion(
            c.source,
            presentation(e).variant,
            f.units === "imperial",
          );
          const suffix =
            f.suffix ||
            (c.showUnit
              ? metricUnit(c.source, presentation(e).variant, converted.unit)
              : "");
          return conditionalDraw(
            e.rules ?? [],
            e.color,
            `        drawComplication(dc, Complications.COMPLICATION_TYPE_${source.constant}, ${e.x}, ${shift ? `${e.y} + (clock.min % 2) * ${aod.shiftY}` : e.y}, font_${e.font.key}, Graphics.TEXT_JUSTIFY_${TEXT_PLACEMENT[e.alignment].justification}, ${hex(e.color)}, ${c.source}, ${converted.scale}, ${converted.offset}, "%.${f.decimals}f", ${JSON.stringify(f.prefix)}, ${JSON.stringify(suffix)}, ${c.openOnHold && !shift}, ${design.onWatch && !shift ? (slots.find((slot) => slot.id === e.id)?.slot ?? 0) : 0});`,
            baseExpression,
          );
        }
        const graphic = drawGraphic(
          e,
          shift ? ` + (clock.min % 2) * ${aod.shiftY}` : "",
          images,
        );
        if (graphic !== null) {
          const source = e.complication?.source ?? e.type;
          const hold = e.complication?.openOnHold ?? e.openOnHold;
          const p = presentation(e);
          const hit =
            !shift && hold && isComplicationSource(source)
              ? ` if (${source} != null) { complicationHits.add([${e.x - p.width / 2}, ${e.y - p.height / 2}, ${e.x + p.width / 2}, ${e.y + p.height / 2}, new Complications.Id(Complications.COMPLICATION_TYPE_${COMPLICATIONS[source].constant}), null, true]); }`
              : "";
          return conditionalDraw(
            e.rules ?? [],
            e.color,
            `        ${graphic}${hit}`,
            baseExpression,
          );
        }
        const hourSource = e.timeFormat === "12" ? "hour" : "clock.hour";
        const part = presentation(e).variant;
        const timePart =
          e.type === "time" && (part === "hours" || part === "minutes")
            ? `${part === "minutes" ? "clock.min" : hourSource}.format("%02d")`
            : null;
        const text =
          (e.type === "status"
            ? `readStatus(Complications.COMPLICATION_TYPE_${STATUS_SOURCES[presentation(e).variant as StatusSource].constant})`
            : null) ??
          timePart ??
          (e.type === "time" && presentation(e).variant === "seconds" && !shift
            ? `timeText${e.timeFormat} + ":" + clock.sec.format("%02d")`
            : null) ??
          (e.type === "date" && presentation(e).variant === "full"
            ? "dateTextFull"
            : null) ??
          (e.type === "date" && presentation(e).variant === "day"
            ? 'today.day.format("%d")'
            : null) ??
          metricText(e.type, presentation(e).variant, e.formatting) ??
          (e.type === "text"
            ? JSON.stringify(e.text)
            : `${e.type}Text${e.type === "time" ? e.timeFormat : ""}`);
        return conditionalDraw(
          e.rules ?? [],
          e.color,
          `        dc.setColor(${hex(e.color)}, Graphics.COLOR_TRANSPARENT);\n        dc.drawText(${e.x}, ${shift ? `${e.y} + (clock.min % 2) * ${aod.shiftY}` : e.y}, font_${e.font.key}, ${text}, Graphics.TEXT_JUSTIFY_${TEXT_PLACEMENT[e.alignment].justification} | Graphics.TEXT_JUSTIFY_VCENTER);${e.openOnHold && !shift && isComplicationSource(e.type) ? ` addTextHit(dc, ${text}, font_${e.font.key}, ${e.x}, ${e.y}, Graphics.TEXT_JUSTIFY_${TEXT_PLACEMENT[e.alignment].justification}, Complications.COMPLICATION_TYPE_${COMPLICATIONS[e.type].constant});` : ""}`,
          baseExpression,
        );
      })
      .join("\n");
  return {
    ...resources,
    ...(design.onWatch
      ? { "resources/watchface-config.xml": watchConfigResource(design) }
      : {}),
    "monkey.jungle":
      "project.manifest = manifest.xml\nbase.sourcePath = source\nbase.resourcePath = resources\n",
    "manifest.xml": `<?xml version="1.0"?>
<iq:manifest xmlns:iq="http://www.garmin.com/xml/connectiq" version="3">
  <iq:application id="364c8c314ff34e75844beaafbc22d970" type="watchface" name="@Strings.AppName" entry="FaceApp" launcherIcon="@Drawables.LauncherIcon" minApiLevel="5.2.0">
    <iq:products><iq:product id="${device.id}"/></iq:products>
    <iq:permissions>
      ${hasComplications ? '<iq:uses-permission id="ComplicationSubscriber"/>' : ""}
      ${dataPermissions(
        requiredMetrics(design),
        compilationLayouts(design).some((layout) =>
          layout.elements.some(
            (e) =>
              e.visible &&
              e.type === "weather" &&
              ["sunrise", "sunset"].includes(presentation(e).variant),
          ),
        ),
      )
        .map((permission) => `<iq:uses-permission id="${permission}"/>`)
        .join("\n      ")}
    </iq:permissions>
    <iq:languages><iq:language>eng</iq:language></iq:languages>
    <iq:barrels/>
  </iq:application>
</iq:manifest>\n`,
    "resources/strings.xml": `<strings><string id="AppName">${design.name}</string><string id="Designed">As designed</string><string id="CustomColors">Custom colors</string><string id="NightStyle">Night layout</string></strings>\n`,
    "resources/drawables.xml": `<drawables><bitmap id="LauncherIcon" filename="icon.svg"/>${images.map((image) => `<bitmap id="${image.key}" filename="${image.key}.png"/>`).join("")}</drawables>\n`,
    "resources/icon.svg":
      '<svg xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 65 65"><circle cx="32" cy="32" r="30" fill="#000000"/><path d="M20 25h25v15H20z" fill="#FFFFFF"/></svg>\n',
    "source/FaceApp.mc": `using Toybox.Application;
using Toybox.WatchUi;
using Toybox.Graphics;
using Toybox.System;
using Toybox.Time;
using Toybox.Time.Gregorian;
using Toybox.ActivityMonitor;
using Toybox.SensorHistory;
using Toybox.Weather;
using Toybox.Math;
${hasComplications ? "using Toybox.Complications;" : ""}

class FaceApp extends Application.AppBase {
    function initialize() { AppBase.initialize(); }
${hasComplications ? complicationLifecycle(design) : "    function getInitialView() { return [new FaceView()]; }"}
}
class FaceView extends WatchUi.WatchFace {
    var sleeping = false;
${images.map((image) => `    var bitmap_${image.key};`).join("\n")}
${fonts.map(({ key }) => `    var font_${key};`).join("\n")}
${nativeFonts.map((e) => `    var font_${e.font.key};`).join("\n")}
    function initialize() { WatchFace.initialize();
${design.onWatch ? "        faceConfig = Application.WatchFaceConfig.getSettings(null);" : ""}
${images.map((image) => `        bitmap_${image.key} = WatchUi.loadResource(Rez.Drawables.${image.key});`).join("\n")}
${fonts.map(({ key }) => `        font_${key} = WatchUi.loadResource(Rez.Fonts.${key});`).join("\n")}
${nativeFonts.map((e) => `        font_${e.font.key} = Graphics.getVectorFont({:face => "RobotoRegular", :size => ${e.size}});`).join("\n")}
    }
${graphicMethods}
${hasComplications ? complicationMethods : ""}
${hasComplications ? watchConfigMethods : ""}
${compilationLayouts(design).some((layout) => layout.elements.some((e) => e.type === "chart" && e.visible)) ? chartMethods : ""}
    function onEnterSleep() { sleeping = true; WatchUi.requestUpdate(); }
    function onExitSleep() { sleeping = false; WatchUi.requestUpdate(); }
    function onUpdate(dc) {
${hasComplications ? "        complicationHits = [];" : ""}
        dc.clearClip();
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        var displayMode = System.getDisplayMode();
        if (displayMode == System.DISPLAY_MODE_OFF) { return; }
        var clock = System.getClockTime();
        var hour = clock.hour % 12;
        if (hour == 0) { hour = 12; }
        var timeText12 = hour.format("%02d") + ":" + clock.min.format("%02d");
        var timeText24 = clock.hour.format("%02d") + ":" + clock.min.format("%02d");
        var battery = System.getSystemStats().battery;
        var batteryText = battery.format("%.0f") + "% battery";
        var today = Gregorian.info(Time.now(), Time.FORMAT_MEDIUM);
        var dateText = today.day_of_week.toUpper() + " " + today.day.format("%d") + " " + today.month.toUpper();
        var dateTextFull = dateText + " " + today.year.format("%d");
        var info = ActivityMonitor.getInfo();
        var steps = info.steps;
        var stepsText = (steps == null ? "--" : steps.format("%d")) + " steps";
${metricSource(design)}
        if (sleeping || displayMode == System.DISPLAY_MODE_LOW_POWER) {
${
  device.capabilities.alwaysOn
    ? `            dc.setClip(${aod.centerX - aod.clipWidth / 2}, ${aod.centerY - aod.clipHeight / 2} + (clock.min % 2) * ${aod.shiftY}, ${aod.clipWidth}, ${aod.clipHeight});
${draw(alwaysOn, true)}
            dc.clearClip();`
    : ""
}
            return;
        }
${
  device.capabilities.lowBattery
    ? `        if (battery <= ${lowBatteryThreshold(design)}) {
            dc.setColor(${hex(lowBattery.background)}, ${hex(lowBattery.background)});
            dc.clear();
${draw(lowBattery)}
            return;
        }`
    : ""
}
${
  design.night?.enabled
    ? `
        var settings = System.getDeviceSettings();
        var minuteOfDay = clock.hour * 60 + clock.min;
        var nightActive = (${nightCondition})${design.onWatch ? " || (faceConfig != null && faceConfig.styleId == 2)" : ""};
        if (nightActive) {
            dc.setColor(${hex(night.background)}, ${hex(night.background)});
            dc.clear();
${draw(night)}
            return;
        }`
    : ""
}
        dc.setColor(${hex(design.background)}, ${hex(design.background)});
        dc.clear();
${draw(design)}
    }
}
${hasComplications ? complicationDelegate.replace("// CONFIGURATION", design.onWatch ? watchConfigDelegate : "") : ""}
`,
  };
}

export function usedFonts(input: Design) {
  const fonts = new Map<string, string>();
  const design = validateDesign(input);
  for (const e of compilationLayouts(design).flatMap((layout) =>
    renderModel(layout, undefined, false),
  )) {
    if (e.family === "garmin" || isGraphic(e.type, presentation(e).variant))
      continue;
    const liveCharacters = {
      time: "0123456789:",
      steps: "0123456789- steps",
      battery: "0123456789% battery",
      date: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
    };
    let chars =
      "0123456789:./+-% abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (e.type === "text") chars = e.text;
    else if (e.type in liveCharacters)
      chars = liveCharacters[e.type as keyof typeof liveCharacters];
    fonts.set(e.font.key, (fonts.get(e.font.key) ?? "?") + chars);
  }
  return [...fonts].map(([key, chars]) => ({ key, chars }));
}

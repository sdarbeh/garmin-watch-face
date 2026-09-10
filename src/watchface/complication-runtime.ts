import { STATUS_SOURCES, type StatusSource } from "./status-sources";
import { presentation } from "./schema";
import { requiredMetrics } from "./garmin-layers";
import { METRIC_SOURCES } from "./data-sources";
import { isComplicationSource, COMPLICATIONS } from "./complications";
import type { Design } from "./schema";
import { compilationLayouts } from "./power";
export function complicationSources(design: Design) {
  return [
    ...new Set([
      ...compilationLayouts(design).flatMap((layout) =>
        layout.elements
          .filter((e) => e.visible && e.complication)
          .map((e) => e.complication!.source),
      ),
      ...compilationLayouts(design)
        .flatMap((layout) =>
          layout.elements
            .filter((e) => e.visible && e.openOnHold)
            .map((e) => e.type),
        )
        .filter(isComplicationSource),
      ...[...requiredMetrics(design)]
        .filter(
          (source) =>
            isComplicationSource(source) &&
            !METRIC_SOURCES[source] &&
            !["steps", "battery"].includes(source),
        )
        .filter(isComplicationSource),
    ]),
  ].filter(isComplicationSource);
}
export function complicationLifecycle(design: Design) {
  return `
    function onStart(state) {
        Complications.registerComplicationChangeCallback(self.method(:onComplicationChanged));
        ${[...new Set(compilationLayouts(design).flatMap((layout) => layout.elements.filter((e) => e.visible && e.type === "status").map((e) => STATUS_SOURCES[presentation(e).variant as StatusSource].constant)))].map((constant) => `try { Complications.subscribeToUpdates(new Complications.Id(Complications.COMPLICATION_TYPE_${constant})); } catch (e) { }`).join("\n")}
        ${complicationSources(design)
          .map(
            (source) =>
              `try { Complications.subscribeToUpdates(new Complications.Id(Complications.COMPLICATION_TYPE_${COMPLICATIONS[source].constant})); } catch (e) { /* Unavailable sources still render --. */ }`,
          )
          .join("\n        ")}
    }
    function onComplicationChanged(id as Complications.Id) as Void { WatchUi.requestUpdate(); }
    function onStop(state) {
        Complications.unsubscribeFromAllUpdates();
        Complications.registerComplicationChangeCallback(null);
    }
    function getInitialView() { var view = new FaceView(); return [view, new FaceDelegate(view)]; }
`;
}
export const complicationMethods = `
    var complicationHits = [];
    function readStatus(source) {
        try { var value = Complications.getComplication(new Complications.Id(source)).value; return value == null ? "--" : value.toString(); } catch (e) { return "--"; }
    }
    function addTextHit(dc, text, font, x, y, align, source) {
        var width = dc.getTextWidthInPixels(text, font); var height = dc.getFontHeight(font);
        var left = x; if (align == Graphics.TEXT_JUSTIFY_CENTER) { left -= width/2; } else if (align == Graphics.TEXT_JUSTIFY_RIGHT) { left -= width; }
        complicationHits.add([left, y-height/2, left+width, y+height/2, new Complications.Id(source), null, true]);
    }
    function readComplication(source, divisor) {
        try { var value = Complications.getComplication(new Complications.Id(source)).value; return value == null ? null : value / divisor; }
        catch (e) { return null; }
    }
    function drawComplication(dc, source, x, y, font, align, color, value, scale, offset, precision, prefix, suffix, hold, slot) {
        var id = new Complications.Id(source);
        var reference = null;
        if (slot > 0 && self has :configuredSource) {
            id = configuredSource(slot, source);
            if (faceConfig != null && faceConfig.complicationSettings != null) {
                for (var configIndex = 0; configIndex < faceConfig.complicationSettings.size(); configIndex++) { var setting = faceConfig.complicationSettings[configIndex]; if (setting.uniqueIdentifier == slot) { reference = setting; } }
            }
            var selectedType = id.getType();
            if (selectedType != source) {
                try { value = Complications.getComplication(id).value; } catch (e) { value = null; }
                ${Object.values(COMPLICATIONS)
                  .map(
                    (c) =>
                      `if (selectedType == Complications.COMPLICATION_TYPE_${c.constant}) { if (value != null) { value /= ${c.divisor}.0; } scale = 1; offset = 0; precision = "%.${c.decimals}f"; suffix = ${JSON.stringify(c.unit)}; }`,
                  )
                  .join("\n                ")}
            }
        }
        var text = formatValue(value, scale, offset, precision, prefix, suffix);
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.drawText(x, y, font, text, align | Graphics.TEXT_JUSTIFY_VCENTER);
        if ((hold && value != null) || slot > 0) {
            var width = dc.getTextWidthInPixels(text, font);
            var height = dc.getFontHeight(font);
            var left = x;
            if (align == Graphics.TEXT_JUSTIFY_CENTER) { left -= width / 2; }
            else if (align == Graphics.TEXT_JUSTIFY_RIGHT) { left -= width; }
            complicationHits.add([left, y - height / 2, left + width, y + height / 2, id, reference, hold && value != null, new WatchUi.Text({:text => text, :font => font, :color => color, :locX => x, :locY => y, :justification => align | Graphics.TEXT_JUSTIFY_VCENTER})]);
        }
    }
    function openComplication(event) {
        var point = event.getCoordinates();
        for (var i = complicationHits.size() - 1; i >= 0; i--) {
            var box = complicationHits[i];
            if (point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3]) {
                if (!box[6]) { return false; }
                try { Complications.exitTo(box[4]); return true; }
                catch (e) { return false; }
            }
        }
        return false;
    }
`;
export const complicationDelegate = `
class FaceDelegate extends WatchUi.WatchFaceDelegate {
    var view;
    function initialize(face) { WatchFaceDelegate.initialize(); view = face; }
    function onPress(event) { return view.openComplication(event); }
    // CONFIGURATION
}
`;

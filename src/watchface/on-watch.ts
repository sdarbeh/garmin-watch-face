import { isGraphic } from "./layer-catalog";
import { presentation } from "./schema";
import { COMPLICATIONS } from "./complications";
import type { Design } from "./schema";
/** Native configuration slots retain layer IDs; layout changes do not shuffle slots. */
export function watchSlots(design: Design) {
  return design.elements
    .filter(
      (e) =>
        e.visible &&
        e.complication &&
        !isGraphic(e.type, presentation(e).variant),
    )
    .map((e, i) => ({ id: e.id, slot: i + 1, source: e.complication!.source }));
}
export function watchConfigResource(design: Design) {
  return `<resources><watchface-config><styles><style id="0" label="@Strings.Designed" default="true"/><style id="1" label="@Strings.CustomColors"/>${design.night?.enabled ? '<style id="2" label="@Strings.NightStyle"/>' : ""}</styles><accentColors allowAny="true"/><dataColors allowAny="true"/><data>${watchSlots(
    design,
  )
    .map(
      (slot) =>
        `<complication id="${slot.slot}">${Object.entries(COMPLICATIONS)
          .map(
            ([key, source]) =>
              `<type${key === slot.source ? ' default="true"' : ""}>Complications.COMPLICATION_TYPE_${source.constant}</type>`,
          )
          .join("")}</complication>`,
    )
    .join("")}</data></watchface-config></resources>`;
}
export const watchConfigMethods = `
    var faceConfig = null;
    function refreshConfiguration(id) {
        faceConfig = Application.WatchFaceConfig.getSettings(id);
        WatchUi.requestUpdate();
    }
    function configurationColor(base, accent) {
        if (faceConfig == null || faceConfig.styleId != 1) { return base; }
        var color = accent ? faceConfig.accentColor : faceConfig.complicationColor;
        return color == null || color.color == null ? base : color.color;
    }
    function configuredSource(slot, source) {
        if (faceConfig != null && faceConfig.complicationSettings != null) {
            for (var configIndex = 0; configIndex < faceConfig.complicationSettings.size(); configIndex++) { var setting = faceConfig.complicationSettings[configIndex];
                if (setting.uniqueIdentifier == slot && setting.complicationId != null) { return setting.complicationId; }
            }
        }
        return new Complications.Id(source);
    }
`;
export const watchConfigDelegate = `
    function onWatchFaceConfigEdited(options) {
        view.refreshConfiguration(options[:configId]);
    }
    function getComplicationDrawable(complication) {
        for (var i = 0; i < view.complicationHits.size(); i++) {
            var box = view.complicationHits[i];
            if (box[5] != null && box[5].uniqueIdentifier == complication.uniqueIdentifier) { return box[7]; }
        }
        return null;
    }
    function onTap(event) {
        var point = event.getCoordinates();
        for (var hitIndex = 0; hitIndex < view.complicationHits.size(); hitIndex++) { var box = view.complicationHits[hitIndex];
            if (point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3] && box[5] != null) { setSelectedComplication(box[5]); return true; }
        }
        return false;
    }
`;

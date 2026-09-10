import { devices } from "../devices/catalog";
import { withMetricFeedback } from "./feedback";
import { withNightIdentity } from "./night-layouts";
import { dotMatrixDesign } from "./dot-matrix";
import { withPresetPowerLayouts } from "./power-layouts";
import { retainedPresets } from "./featured";
import { collectionPresets } from "./collection";
import { defaultFeatures, type Design } from "../watchface/schema";
export interface Preset {
  slug: string;
  name: string;
  description: string;
  compatibleDevices: readonly string[];
  design: Design;
}
const featured: readonly Preset[] = [
  ...retainedPresets,
  {
    slug: "dot-matrix",
    name: "Dot matrix",
    description:
      "A retro dotted display with a full date and compact health and activity readouts.",
    compatibleDevices: ["fr970"],
    design: withPresetPowerLayouts(dotMatrixDesign, "dot-matrix"),
  },
];
const nightPreset = (preset: Preset): Preset => ({
  ...preset,
  compatibleDevices: devices.map((device) => device.id),
  design: {
    ...withMetricFeedback(withNightIdentity(preset.design, preset.slug)),
    ...defaultFeatures(preset.design.device),
  },
});
export const featuredPresets: readonly Preset[] = featured.map(nightPreset);
export const presets: readonly Preset[] = [
  ...featuredPresets,
  ...collectionPresets.map(nightPreset),
];
export const getPreset = (slug: string) =>
  presets.find((preset) => preset.slug === slug);

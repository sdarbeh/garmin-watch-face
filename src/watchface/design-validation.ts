import { getDeviceById } from "@/devices/catalog";
import { estimateAodLuminance } from "./aod";
import { MAX_TOTAL_IMAGE_DATA_LENGTH } from "./image-limits";
import { powerLayout, type PowerMode } from "./power";
import { layerLayoutIssues } from "./render-model";
import { ruleConflicts } from "./rules";
import { presentation, type Design, type FaceElement } from "./schema";

export type DesignIssueSeverity = "error" | "warning";

export interface DesignIssue {
  id: string;
  severity: DesignIssueSeverity;
  mode?: PowerMode;
  elementId?: string;
  title: string;
  message: string;
}

const AOD_LUMINANCE_LIMIT = 0.1;
const IMAGE_BUDGET_WARNING_RATIO = 0.8;
const MIN_VISIBLE_CONTRAST = 1.5;

function colorLuminance(color: string) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: string, second: string) {
  const brighter = Math.max(colorLuminance(first), colorLuminance(second));
  const darker = Math.min(colorLuminance(first), colorLuminance(second));
  return (brighter + 0.05) / (darker + 0.05);
}

function modesForDesign(design: Design): PowerMode[] {
  const capabilities = getDeviceById(design.device)!.capabilities;
  return [
    "normal",
    ...(capabilities.alwaysOn ? (["always-on"] as const) : []),
    ...(capabilities.lowBattery ? (["low-battery"] as const) : []),
    ...(design.night?.enabled ? (["night"] as const) : []),
  ];
}

function elementIssues(
  layout: Design,
  mode: PowerMode,
  element: FaceElement,
): DesignIssue[] {
  const issues: DesignIssue[] = [];
  if (element.type === "image" && !presentation(element).image) {
    issues.push({
      id: `${mode}:${element.id}:empty-image`,
      severity: "error",
      mode,
      elementId: element.id,
      title: "Image is missing",
      message:
        "An image layer is empty. Upload an image, hide the layer, or delete it before building.",
    });
  }

  if (
    element.type !== "image" &&
    contrastRatio(element.color, layout.background) < MIN_VISIBLE_CONTRAST
  ) {
    issues.push({
      id: `${mode}:${element.id}:contrast`,
      severity: "warning",
      mode,
      elementId: element.id,
      title: "Layer may be hard to see",
      message: "Increase the contrast between this layer and the background.",
    });
  }

  const conflicts = ruleConflicts(element.rules ?? []);
  if (conflicts.length > 0) {
    issues.push({
      id: `${mode}:${element.id}:rule-conflict`,
      severity: "warning",
      mode,
      elementId: element.id,
      title: "Rules can conflict",
      message: `${conflicts.length} overlapping or duplicate rule${conflicts.length === 1 ? " needs" : "s need"} review.`,
    });
  }

  return issues;
}

function modeIssues(design: Design, mode: PowerMode): DesignIssue[] {
  const layout = powerLayout(design, mode);
  const visible = layout.elements.filter((element) => element.visible);
  const issues = visible.flatMap((element) =>
    elementIssues(layout, mode, element),
  );

  if (visible.length === 0) {
    issues.push({
      id: `${mode}:empty-layout`,
      severity: "warning",
      mode,
      title: "Layout is empty",
      message: "Add or show a layer so this display mode has visible content.",
    });
  }

  for (const issue of layerLayoutIssues(layout)) {
    issues.push({
      id: `${mode}:${issue.elementId}:clipping`,
      severity: "warning",
      mode,
      elementId: issue.elementId,
      title: "Layer may be clipped",
      message: issue.message,
    });
  }

  if (mode === "always-on") {
    const luminance = estimateAodLuminance(layout);
    if (luminance > AOD_LUMINANCE_LIMIT) {
      issues.push({
        id: `${mode}:luminance`,
        severity: "warning",
        mode,
        title: "Always-on face may be too bright",
        message: `Estimated luminance is ${Math.round(luminance * 100)}%. Keep it below 10% and verify it in Garmin’s simulator.`,
      });
    }
  }

  return issues;
}

function imageBudgetIssues(design: Design): DesignIssue[] {
  const encodedBytes = [
    ...design.elements,
    ...Object.values(design.layouts ?? {}).flatMap(
      (layout) => layout.elements,
    ),
  ].reduce(
    (total, element) => total + (element.presentation?.image.length ?? 0),
    0,
  );
  if (
    encodedBytes <
    MAX_TOTAL_IMAGE_DATA_LENGTH * IMAGE_BUDGET_WARNING_RATIO
  )
    return [];
  return [
    {
      id: "project:image-budget",
      severity: "warning",
      title: "Image storage is nearly full",
      message: `Images use ${Math.round((encodedBytes / MAX_TOTAL_IMAGE_DATA_LENGTH) * 100)}% of the project budget.`,
    },
  ];
}

/** Returns deterministic, actionable checks without mutating the design. */
export function designIssues(design: Design): DesignIssue[] {
  return [
    ...imageBudgetIssues(design),
    ...modesForDesign(design).flatMap((mode) => modeIssues(design, mode)),
  ];
}

export function assertDesignExportable(design: Design) {
  const blockers = designIssues(design).filter(
    (issue) => issue.severity === "error",
  );
  if (blockers.length > 0) {
    const messages = [...new Set(blockers.map((issue) => issue.message))];
    throw new Error(messages.join(" "));
  }
}

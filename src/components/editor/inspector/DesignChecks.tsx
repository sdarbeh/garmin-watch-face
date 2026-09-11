import { WarningIcon } from "@/icons";
import type { DesignIssue } from "@/watchface/design-validation";
import type { Design } from "@/watchface/schema";
import { layerLabel } from "../types";
import { InspectorSection } from "./InspectorSection";

const MODE_LABELS = {
  normal: "Normal",
  "always-on": "Always-on",
  "low-battery": "Low battery",
  night: "Night",
} as const;

export function DesignChecks({
  design,
  issues,
}: {
  design: Design;
  issues: DesignIssue[];
}) {
  if (issues.length === 0) return null;
  const hasErrors = issues.some((issue) => issue.severity === "error");
  const elementsById = new Map(
    [
      ...design.elements,
      ...Object.values(design.layouts ?? {}).flatMap(
        (layout) => layout.elements,
      ),
    ].map((element) => [element.id, element]),
  );

  return (
    <InspectorSection
      title={`Design checks (${issues.length})`}
      defaultOpen={hasErrors}
    >
      <div className="watchface-design-checks" role="list">
        {issues.map((issue) => {
          const element = issue.elementId
            ? elementsById.get(issue.elementId)
            : undefined;
          return (
            <div
              key={issue.id}
              className="watchface-design-issue"
              data-severity={issue.severity}
              role="listitem"
            >
              <WarningIcon size="sm" />
              <div>
                <p className="u-font-xs u-weight-medium">
                  {issue.mode ? `${MODE_LABELS[issue.mode]} · ` : ""}
                  {element ? `${layerLabel(element)} · ` : ""}
                  {issue.title}
                </p>
                <p className="u-font-xs u-text-secondary">{issue.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </InspectorSection>
  );
}

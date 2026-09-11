import type { DesignIssue } from "@/watchface/design-validation";
import type { Design } from "@/watchface/schema";
import { layerLabel } from "@/components/editor/types";
import { InspectorSection } from "./InspectorSection";
import { EDITOR_MODE_LABELS } from "@/components/editor/model/display-modes";
import { ValidationIssueButton } from "@/components/editor/validation/ValidationIssueButton";

export function DesignChecks({
  design,
  issues,
  onIssueSelect,
}: {
  design: Design;
  issues: DesignIssue[];
  onIssueSelect: (issue: DesignIssue) => void;
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
      <div className="watchface-design-checks">
        {issues.map((issue) => {
          const element = issue.elementId
            ? elementsById.get(issue.elementId)
            : undefined;
          return (
            <ValidationIssueButton
              key={issue.id}
              issue={issue}
              context={[
                issue.mode ? EDITOR_MODE_LABELS[issue.mode] : "",
                element ? layerLabel(element) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
              onClick={() => onIssueSelect(issue)}
            />
          );
        })}
      </div>
    </InspectorSection>
  );
}

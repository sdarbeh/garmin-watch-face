import { Button } from "@/components/ui";
import { WarningIcon } from "@/icons";
import type { DesignIssue } from "@/watchface/design-validation";

export function ValidationIssueButton({
  issue,
  context,
  onClick,
}: {
  issue: DesignIssue;
  context?: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant={issue.severity === "error" ? "danger" : "secondary"}
      size="sm"
      className="watchface-validation-issue"
      data-severity={issue.severity}
      onClick={onClick}
    >
      <WarningIcon size="sm" />
      <span className="watchface-validation-issue__copy">
        <strong>
          {context ? `${context} · ` : ""}
          {issue.title}
        </strong>
        <span>{issue.message}</span>
      </span>
    </Button>
  );
}

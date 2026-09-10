import { CheckCircleIcon } from "@/icons";
import { cx } from "@/utils/css";

type WorkflowStepsProps = {
  steps: readonly string[];
  /** One-based index of the current step. */
  current: number;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
};

export function WorkflowSteps({
  steps,
  current,
  ariaLabel = "Progress",
  className,
  size = "md",
}: WorkflowStepsProps) {
  return (
    <ol
      className={cx("workflow-steps", className)}
      aria-label={ariaLabel}
      data-size={size}
    >
      {steps.map((label, index) => {
        const position = index + 1;
        const complete = position < current;
        return (
          <li
            key={position}
            aria-current={position === current ? "step" : undefined}
            data-reached={position <= current}
            data-complete={complete}
          >
            <span className="workflow-steps__number" aria-hidden="true">
              {complete ? <CheckCircleIcon /> : position}
            </span>
            <span>
              {label}
              {complete && <span className="u-sr-only"> — completed</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

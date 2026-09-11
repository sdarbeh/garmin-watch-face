import type { GoalSource } from "@/watchface/goals";
import type { Simulation } from "../model/simulation";
export function RuleGoalPreview({
  source,
  simulation,
  onChange,
}: {
  source: GoalSource;
  simulation: Simulation;
  onChange: (value: Simulation) => void;
}) {
  const goal = simulation.goals?.[source];
  return (
    <>
      <label className="watchface-property-row">
        Preview daily goal
        <input
          type="number"
          min={0}
          max={999999}
          step={1}
          placeholder="Unavailable"
          value={goal ?? ""}
          onChange={(event) => {
            const n = event.target.valueAsNumber;
            if (
              event.target.value === "" ||
              (Number.isInteger(n) && n >= 0 && n <= 999999)
            )
              onChange({
                ...simulation,
                goals: {
                  ...simulation.goals,
                  [source]: event.target.value === "" ? null : n,
                },
              });
          }}
        />
      </label>
      <p className="u-font-xs u-text-secondary mb2">
        Uses the goal set on the watch. Clear the preview goal to simulate
        unavailable data; missing or zero goals do not trigger this rule.
      </p>
    </>
  );
}

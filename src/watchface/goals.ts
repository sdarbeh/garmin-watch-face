/** Goal and value must cover the same period. Active minutes are daily in this editor. */
export const GOAL_SOURCES = {
  steps: { field: "stepGoal", sample: 10000 },
  floors: { field: "floorsClimbedGoal", sample: 10 },
} as const;
export type GoalSource = keyof typeof GOAL_SOURCES;
export type GoalSamples = Partial<Record<GoalSource, number | null>>;
export const hasUserGoal = (source: string): source is GoalSource =>
  Object.hasOwn(GOAL_SOURCES, source);
export const SAMPLE_GOALS: GoalSamples = { steps: 10000, floors: 10 };

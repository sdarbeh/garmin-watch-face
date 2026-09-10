export const STATUS_SOURCES = {
  "training-status": {
    label: "Training status",
    constant: "TRAINING_STATUS",
    sample: "Productive",
  },
  "calendar-event": {
    label: "Next calendar event",
    constant: "CALENDAR_EVENTS",
    sample: "14:30",
  },
} as const;
export type StatusSource = keyof typeof STATUS_SOURCES;

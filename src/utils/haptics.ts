export const UI_HAPTIC_PATTERNS = {
  press: 10,
  ripple: [8, 24, 14],
} as const satisfies Record<string, VibratePattern>;

export type UiHapticEvent = keyof typeof UI_HAPTIC_PATTERNS;

type HapticOptions = {
  enabled?: boolean;
};

const canUseHaptics = () =>
  typeof window !== "undefined" &&
  typeof window.navigator?.vibrate === "function";

export const triggerHapticPattern = (
  pattern: VibratePattern,
  options: HapticOptions = {},
) => {
  if (options.enabled === false || !canUseHaptics()) return false;
  return window.navigator.vibrate(pattern);
};

// UI haptics reinforce meaningful state changes; gameplay owns its semantic effects.
export const triggerUiHaptic = (
  event: UiHapticEvent,
  options?: HapticOptions,
) => triggerHapticPattern(UI_HAPTIC_PATTERNS[event], options);

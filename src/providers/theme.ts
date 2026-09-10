import type { AppColorMode, AppThemeMode } from "./types";

export const getAppThemeMode = (value: string | null): AppThemeMode => {
  if (value === "auto" || value === "light" || value === "dark") return value;
  return "auto";
};

export const resolveAppColorMode = (
  mode: AppThemeMode,
  systemPrefersDark: boolean,
): AppColorMode => {
  if (mode !== "auto") return mode;
  return systemPrefersDark ? "dark" : "light";
};

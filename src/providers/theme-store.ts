import { getAppThemeMode } from "./theme";
import type { AppThemeMode } from "./types";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

/** Browser preference with a session fallback if storage is unavailable or full. */
export function createThemeStore(storage: () => ThemeStorage, key: string) {
  let memoryMode: AppThemeMode = "auto";
  let memoryOnly = false;
  return {
    getSnapshot(): AppThemeMode {
      if (memoryOnly) return memoryMode;
      try {
        memoryMode = getAppThemeMode(storage().getItem(key));
      } catch {}
      return memoryMode;
    },
    setMode(mode: AppThemeMode) {
      memoryMode = mode;
      try {
        storage().setItem(key, mode);
        memoryOnly = false;
      } catch {
        memoryOnly = true;
      }
    },
  };
}

"use client";

import { useEffect, useSyncExternalStore, type PropsWithChildren } from "react";

import { APP_COLOR_SCHEME_QUERY, APP_THEME_STORAGE_KEY } from "@/constants";
import { useMediaQuery } from "@/hooks";
import { createThemeStore } from "./theme-store";
import { resolveAppColorMode } from "./theme";
import type { AppThemeMode } from "./types";

// One browser preference shared by theme consumers; storage is never read during SSR.
const themeStore = createThemeStore(
  () => window.localStorage,
  APP_THEME_STORAGE_KEY,
);
const getThemeMode = themeStore.getSnapshot;

const getServerThemeMode = (): AppThemeMode => "auto";

const syncDocumentTheme = (mode: AppThemeMode, prefersDark: boolean) => {
  const colorMode = resolveAppColorMode(mode, prefersDark);
  const root = document.documentElement;
  root.classList.toggle("dark", colorMode === "dark");
  root.classList.toggle("light", colorMode === "light");
  root.dataset.theme = colorMode;
  root.dataset.themeMode = mode;
  root.style.colorScheme = colorMode;
};

const subscribeToThemeMode = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
};

export function useAppThemeMode() {
  return useSyncExternalStore(
    subscribeToThemeMode,
    getThemeMode,
    getServerThemeMode,
  );
}
export function setAppThemeMode(mode: AppThemeMode) {
  themeStore.setMode(mode);
  window.dispatchEvent(new Event("storage"));
}

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const prefersDark = useMediaQuery(APP_COLOR_SCHEME_QUERY);
  const mode = useAppThemeMode();
  useEffect(() => {
    syncDocumentTheme(mode, prefersDark);
  }, [mode, prefersDark]);

  return children;
};

import { APP_COLOR_SCHEME_QUERY, APP_THEME_STORAGE_KEY } from "@/constants";

export const APP_THEME_SCRIPT = `
(() => {
  try {
    const storageKey = "${APP_THEME_STORAGE_KEY}";
    const colorSchemeQuery = "${APP_COLOR_SCHEME_QUERY}";
    const storedMode = window.localStorage.getItem(storageKey);
    const themeMode =
      storedMode === "auto" || storedMode === "light" || storedMode === "dark"
        ? storedMode
        : "auto";
    let colorMode = themeMode;

    if (themeMode === "auto") {
      colorMode = window.matchMedia(colorSchemeQuery).matches ? "dark" : "light";
    }

    const root = document.documentElement;
    root.classList.remove(colorMode === "dark" ? "light" : "dark");
    root.classList.add(colorMode);
    root.dataset.theme = colorMode;
    root.dataset.themeMode = themeMode;
    root.style.colorScheme = colorMode;
  } catch {
    document.documentElement.style.colorScheme = "light dark";
  }
})();
`;

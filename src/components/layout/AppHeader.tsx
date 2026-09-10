"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getDeviceById } from "@/devices/catalog";
import { useLibrary } from "@/library/useLibrary";
import { browserLibrary } from "@/library/store";
import { setAppThemeMode, useAppThemeMode } from "@/providers/AppThemeProvider";
import { Button } from "@/components/ui";
import { WatchPickerModal } from "@/components/devices/WatchPickerModal";
import { ThemeIcon } from "@/icons";
import { useMediaQuery } from "@/hooks";
import { APP_COLOR_SCHEME_QUERY } from "@/constants";
import { resolveAppColorMode } from "@/providers/theme";
export function AppHeader() {
  const pathname = usePathname();
  const library = useLibrary();
  const theme = useAppThemeMode();
  const prefersDark = useMediaQuery(APP_COLOR_SCHEME_QUERY);
  const colorMode = resolveAppColorMode(theme, prefersDark);
  const nextTheme = colorMode === "dark" ? "light" : "dark";
  const [choosing, setChoosing] = useState(false);
  const watch = library.selectedWatch
    ? getDeviceById(library.selectedWatch)
    : undefined;
  return (
    <header className="app-header">
      <div className="app-header__inner u-flex u-items-center u-justify-between gap3">
        <Link href="/" className="app-header__brand">
          Watchface Studio
        </Link>
        <nav className="app-header__nav" aria-label="Main navigation">
          <Link
            href="/presets"
            aria-current={
              pathname === "/presets" || pathname.startsWith("/presets/")
                ? "page"
                : undefined
            }
          >
            Presets
          </Link>
          <Link
            href="/designs"
            aria-current={pathname === "/designs" ? "page" : undefined}
          >
            My Designs
          </Link>
          <Button
            size="sm"
            variant="ghost"
            disabled={!library.ready}
            aria-haspopup="dialog"
            onClick={() => setChoosing(true)}
          >
            {watch?.name ?? "Choose your watch"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={() => setAppThemeMode(nextTheme)}
          >
            <ThemeIcon mode={colorMode} size="sm" />
          </Button>
        </nav>
      </div>
      {choosing && (
        <WatchPickerModal
          onClose={() => setChoosing(false)}
          onSelect={(watch) => {
            browserLibrary.selectWatch(watch.id);
            setChoosing(false);
          }}
        />
      )}
    </header>
  );
}

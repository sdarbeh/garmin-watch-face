"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AppHeader } from "./AppHeader";

export function AppContainer({ children }: PropsWithChildren) {
  const editor = usePathname().startsWith("/editor/");
  return (
    <>
      <a href="#main-content" className="app-skip-link">
        Skip to content
      </a>
      {!editor && <AppHeader />}
      <main
        id="main-content"
        tabIndex={-1}
        className={editor ? "app-editor-main" : "app-main"}
      >
        {children}
      </main>
    </>
  );
}

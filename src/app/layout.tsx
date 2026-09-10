import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppContainer } from "@/components/layout";
import { AppThemeProvider, APP_THEME_SCRIPT } from "@/providers";
import "@/styles/index.scss";
const inter = localFont({
  src: [
    { path: "../../assets/fonts/inter/Inter-Regular.woff", weight: "400" },
    { path: "../../assets/fonts/inter/Inter-Medium.woff", weight: "500" },
    { path: "../../assets/fonts/inter/Inter-SemiBold.woff", weight: "600" },
    { path: "../../assets/fonts/inter/Inter-Bold.woff", weight: "700" },
  ],
  variable: "--font-inter",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Watchface Studio",
  description: "Your personal Garmin watch-face builder.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APP_THEME_SCRIPT }} />
      </head>
      <body>
        <AppThemeProvider>
          <AppContainer>{children}</AppContainer>
        </AppThemeProvider>
      </body>
    </html>
  );
}

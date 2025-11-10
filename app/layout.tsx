import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/app/features/theme/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-base",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AniSauce",
  description: "anime source finder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="theme-dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            try {
              var storageKey = "anisauce-theme";
              var stored = window.localStorage.getItem(storageKey);
              var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
              var theme = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
              var root = document.documentElement;
              root.dataset.theme = theme;
              root.classList.remove("theme-light", "theme-dark");
              root.classList.add("theme-" + theme);
              root.style.setProperty("color-scheme", theme);
            } catch (error) {
              // ignore init errors
            }
          })();`}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

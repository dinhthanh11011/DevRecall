import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { NavLinks } from "@/components/NavLinks";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

// Font pairing from design-system/devrecall/MASTER.md; both ship Vietnamese glyphs.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: { default: "DevRecall", template: "%s · DevRecall" },
  description: "Senior full-stack interview prep — zero-to-hero roadmap, study notes and question banks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${plexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-30 focus:rounded-md focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6">
            <Link href="/" className="shrink-0 font-semibold tracking-tight">
              Dev<span className="text-blue-600 dark:text-blue-400">Recall</span>
            </Link>
            <NavLinks />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          Content in <code>content/</code> — contribute via PR. Progress is stored in your browser only.
        </footer>
      </body>
    </html>
  );
}

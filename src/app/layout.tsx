import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "DevRecall", template: "%s · DevRecall" },
  description: "Senior full-stack interview prep — zero-to-hero roadmap, study notes and question banks.",
};

const NAV = [
  { href: "/", label: "Roadmap" },
  { href: "/plans", label: "Lộ trình" },
  { href: "/random", label: "Random" },
  { href: "/practice", label: "Practice" },
  { href: "/search", label: "Search" },
  { href: "/progress", label: "Progress" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
            <Link href="/" className="font-semibold tracking-tight">
              Dev<span className="text-sky-600">Recall</span>
            </Link>
            <nav className="flex gap-4 overflow-x-auto text-sm text-zinc-600 dark:text-zinc-400">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-zinc-950 dark:hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Content in <code>content/</code> — contribute via PR. Progress is stored in your browser only.
        </footer>
      </body>
    </html>
  );
}

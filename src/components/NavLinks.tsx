"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Roadmap" },
  { href: "/plans", label: "Lộ trình" },
  { href: "/random", label: "Random" },
  { href: "/practice", label: "Practice" },
  { href: "/search", label: "Search" },
  { href: "/progress", label: "Progress" },
];

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/tracks") : pathname.startsWith(href));

  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto text-sm">
      {NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center whitespace-nowrap rounded-md px-2.5 transition-colors ${
              active
                ? "bg-slate-100 font-medium text-slate-950 dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

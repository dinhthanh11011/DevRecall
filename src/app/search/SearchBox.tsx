"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Level } from "@/lib/constants";
import { LevelBadge } from "@/components/Badges";

type Entry = { id: string; slug: string; track: string; level: Level; q: string; tags: string[] };

export function SearchBox({ index }: { index: Entry[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index
      .filter((e) => {
        const hay = `${e.q} ${e.track} ${e.tags.join(" ")}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 100);
  }, [index, query]);

  return (
    <div className="space-y-4">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${index.length} questions — e.g. "outbox kafka", "useEffect", "isolation"`}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {query && <p className="text-xs text-zinc-500">{results.length >= 100 ? "100+" : results.length} results</p>}
      <ul className="space-y-2">
        {results.map((e) => (
          <li key={e.id}>
            <Link
              href={`/tracks/${e.slug}#${e.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-3 hover:border-sky-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                <LevelBadge level={e.level} />
                <span>{e.track}</span>
              </div>
              <p className="text-sm">{e.q}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

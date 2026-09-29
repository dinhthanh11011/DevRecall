"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchEntry } from "@/lib/types";
import { LevelBadge } from "@/components/Badges";

const haystack = (e: SearchEntry) =>
  (e.kind === "question" ? `${e.q} ${e.track} ${e.tags.join(" ")}` : `${e.title} ${e.track} ${e.snippet}`).toLowerCase();

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/data/search")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setIndex)
      .catch(() => setFailed(true));
  }, []);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index.filter((e) => terms.every((t) => haystack(e).includes(t))).slice(0, 100);
  }, [index, query]);

  return (
    <div className="space-y-4">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${index.length ? `${index.filter((e) => e.kind === "question").length} questions` : "questions"} and the lessons — e.g. "outbox kafka", "useEffect", "isolation"`}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {failed && <p className="text-xs text-rose-600">Không tải được search index.</p>}
      {query && <p className="text-xs text-zinc-500">{results.length >= 100 ? "100+" : results.length} results</p>}
      <ul className="space-y-2">
        {results.map((e) => (
          <li key={e.id}>
            {e.kind === "lesson" ? (
              <Link
                href={e.href}
                className="block rounded-lg border border-emerald-200 bg-white p-3 hover:border-emerald-400 dark:border-emerald-900 dark:bg-zinc-900"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    📚 Bài học
                  </span>
                  <span>{e.track}</span>
                </div>
                <p className="text-sm font-medium">{e.title}</p>
                {e.snippet && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{e.snippet}</p>}
              </Link>
            ) : (
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
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

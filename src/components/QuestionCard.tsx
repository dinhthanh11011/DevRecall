"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/schema";
import { RATINGS, clearRating, rate, useProgress, type Rating } from "@/lib/progress";
import { Chip, LevelBadge } from "./Badges";
import { Markdown } from "./Markdown";

export function RatingButtons({ id, onRated }: { id: string; onRated?: (r: Rating) => void }) {
  const current = useProgress()[id]?.r;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">Tự chấm:</span>
      {RATINGS.map((r) => (
        <button
          key={r.value}
          type="button"
          title={r.hint}
          onClick={() => {
            rate(id, r.value);
            onRated?.(r.value);
          }}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            current === r.value
              ? `${r.className} text-white`
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {r.value} · {r.label}
        </button>
      ))}
      {current !== undefined && (
        <button type="button" onClick={() => clearRating(id)} className="text-xs text-zinc-400 underline">
          clear
        </button>
      )}
    </div>
  );
}

export function Answer({ q }: { q: Question }) {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Gợi ý trả lời</h4>
        <Markdown compact>{q.hint}</Markdown>
      </section>
      {q.followUp && (
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Follow-up they&apos;ll ask</h4>
          <Markdown compact>{`→ ${q.followUp}`}</Markdown>
        </section>
      )}
      {q.redFlags && q.redFlags.length > 0 && (
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Red flags (weak answer)</h4>
          <ul className="space-y-1 text-sm text-rose-700 dark:text-rose-400">
            {q.redFlags.map((f) => (
              <li key={f}>✗ {f}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false);
  const rating = useProgress()[q.id]?.r;

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === `#${q.id}`) setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [q.id]);

  const dot = rating === undefined ? "bg-zinc-300 dark:bg-zinc-700" : RATINGS[rating].className;

  return (
    <article id={q.id} className="scroll-mt-24 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} title={rating === undefined ? "not rated" : RATINGS[rating].label} />
        <span className="flex-1 space-y-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-zinc-400">Q{index}</span>
            <LevelBadge level={q.level} />
            <Chip>{q.type}</Chip>
            {q.verify && <Chip>⚠ verify</Chip>}
          </span>
          <span className="block font-medium leading-snug">
            <Markdown inline>{q.q}</Markdown>
          </span>
        </span>
        <span className="mt-1 text-zinc-400">{open ? "−" : "+"}</span>
      </button>
      {q.example && (
        <div className="px-4 pb-2 pl-9">
          <Markdown compact>{q.example}</Markdown>
        </div>
      )}
      {open && (
        <div className="space-y-4 border-t border-zinc-100 p-4 pl-9 dark:border-zinc-800">
          <Answer q={q} />
          <RatingButtons id={q.id} />
        </div>
      )}
    </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/schema";
import { RATINGS, clearRating, rate, useProgress, type Rating } from "@/lib/progress";
import type { RichQuestion } from "@/lib/types";
import { Chip, EssentialBadge, LevelBadge, VerifyChip } from "./Badges";
import { Icon } from "./Icon";
import { LearnPanel } from "./LearnPanel";
import { Markdown } from "./Markdown";

export function RatingButtons({ id, onRated }: { id: string; onRated?: (r: Rating) => void }) {
  const current = useProgress()[id]?.r;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">Tự chấm:</span>
      {RATINGS.map((r) => (
        <button
          key={r.value}
          type="button"
          title={r.hint}
          aria-pressed={current === r.value}
          onClick={() => {
            rate(id, r.value);
            onRated?.(r.value);
          }}
          className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            current === r.value
              ? `${r.selected} text-white`
              : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          {r.value} · {r.label}
        </button>
      ))}
      {current !== undefined && (
        <button type="button" onClick={() => clearRating(id)} className="min-h-9 px-1 text-xs text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300">
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
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Gợi ý trả lời</h4>
        <Markdown compact>{q.hint}</Markdown>
      </section>
      {q.followUp && (
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up they&apos;ll ask</h4>
          <Markdown compact>{`→ ${q.followUp}`}</Markdown>
        </section>
      )}
      {q.redFlags && q.redFlags.length > 0 && (
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Red flags (weak answer)</h4>
          <ul className="space-y-1 text-sm text-rose-700 dark:text-rose-400">
            {q.redFlags.map((f) => (
              <li key={f} className="flex gap-1.5">
                <Icon name="x" className="mt-0.5 h-4 w-4" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function QuestionCard({
  q,
  index,
  onTrackPage = true,
}: {
  q: RichQuestion;
  index: number;
  /** Rendered on the track page, so overview refs can link to `#anchor`. */
  onTrackPage?: boolean;
}) {
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

  const dot = rating === undefined ? "bg-slate-300 dark:bg-slate-700" : RATINGS[rating].className;

  return (
    <article id={q.id} className="scroll-mt-24 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} title={rating === undefined ? "not rated" : RATINGS[rating].label} />
        <span className="flex-1 space-y-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-500">Q{index}</span>
            <LevelBadge level={q.level} />
            <Chip>{q.type}</Chip>
            {q.essential && <EssentialBadge />}
            {q.verify && <VerifyChip />}
          </span>
          <span className="block font-medium leading-snug">
            <Markdown inline>{q.q}</Markdown>
          </span>
        </span>
        <Icon name="chevron" className={`mt-1 h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {q.example && (
        <div className="px-4 pb-2 pl-9">
          <Markdown compact>{q.example}</Markdown>
        </div>
      )}
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 pl-9 dark:border-slate-800">
          <Answer q={q} />
          <LearnPanel refs={q.refs} slug={q.id.replace(/-\d{3}$/, "")} samePage={onTrackPage} />
          <RatingButtons id={q.id} />
        </div>
      )}
    </article>
  );
}

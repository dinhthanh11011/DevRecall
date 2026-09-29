"use client";

import { trackStats, useProgress } from "@/lib/progress";

export function Bar({ value, className = "bg-emerald-500" }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function TrackProgress({ slug, total }: { slug: string; total: number }) {
  const progress = useProgress();
  if (!total) return null;
  const s = trackStats(progress, slug, total);
  return (
    <div className="space-y-1">
      <Bar value={s.mastery} />
      <p className="text-xs text-zinc-500">
        {s.rated}/{total} rated · mastery {Math.round(s.mastery * 100)}%{s.weak ? ` · ${s.weak} weak` : ""}
      </p>
    </div>
  );
}

export function OverallProgress({ total }: { total: number }) {
  const progress = useProgress();
  const entries = Object.values(progress);
  const mastery = total ? entries.reduce((n, e) => n + e.r, 0) / (total * 4) : 0;
  return (
    <div className="space-y-1">
      <Bar value={mastery} className="bg-sky-500" />
      <p className="text-xs text-zinc-500">
        {entries.length}/{total} questions rated · overall mastery {Math.round(mastery * 100)}%
      </p>
    </div>
  );
}

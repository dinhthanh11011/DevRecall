"use client";

import { trackStats, useProgress } from "@/lib/progress";

export function Bar({ value, className = "bg-emerald-500", label }: { value: number; className?: string; label?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
    >
      <div className={`h-full rounded-full transition-[width] duration-300 ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TrackProgress({ slug, total }: { slug: string; total: number }) {
  const progress = useProgress();
  if (!total) return null;
  const s = trackStats(progress, slug, total);
  return (
    <div className="space-y-1">
      <Bar value={s.mastery} label="Track mastery" />
      <p className="text-xs text-slate-500">
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
      <Bar value={mastery} className="bg-blue-500" label="Overall mastery" />
      <p className="text-xs text-slate-500">
        {entries.length}/{total} questions rated · overall mastery {Math.round(mastery * 100)}%
      </p>
    </div>
  );
}

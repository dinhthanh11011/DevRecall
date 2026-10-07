"use client";

import Link from "next/link";
import { useState } from "react";
import type { ResolvedPlan } from "@/lib/content";
import { RATINGS, useProgress } from "@/lib/progress";
import { LevelBadge } from "@/components/Badges";
import { Markdown } from "@/components/Markdown";
import { doneCount, PlanProgress } from "../PlanProgress";
import { Icon } from "@/components/Icon";

type Day = ResolvedPlan["days"][number];

export function PlanDays({ days }: { days: Day[] }) {
  const progress = useProgress();
  // The first day that isn't finished is "today"; it starts expanded.
  const today = days.findIndex((d) => doneCount(progress, d.questionIds) < d.questionIds.length);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const isOpen = (i: number) => open.has(i) || (i === today && !open.has(-1 - i));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (isOpen(i)) {
        next.delete(i);
        if (i === today) next.add(-1 - i);
      } else {
        next.add(i);
        next.delete(-1 - i);
      }
      return next;
    });

  return (
    <ol className="space-y-4">
      {days.map((day, i) => {
        const done = doneCount(progress, day.questionIds);
        const complete = done === day.questionIds.length;
        return (
          <li
            key={day.title}
            className={`rounded-xl border bg-white dark:bg-slate-900 ${
              i === today ? "border-blue-400 dark:border-blue-700" : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen(i)} className="flex w-full items-start gap-3 p-4 text-left">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  complete ? "bg-emerald-500 text-white" : i === today ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {complete ? <Icon name="check" className="h-4 w-4" label="Hoàn thành" /> : i + 1}
              </span>
              <span className="flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{day.title}</span>
                  {i === today && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">Hôm nay</span>}
                </span>
                <span className="block text-sm text-slate-600 dark:text-slate-400">{day.goal}</span>
                <span className="block max-w-sm pt-1">
                  <PlanProgress ids={day.questionIds} />
                </span>
              </span>
              <span className="mt-1 text-slate-500">{isOpen(i) ? "−" : "+"}</span>
            </button>
            {isOpen(i) && (
              <div className="space-y-5 border-t border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/practice?ids=${day.questionIds.join(",")}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Practice phần này ({day.questionIds.length} câu)
                  </Link>
                </div>
                {day.items.map((item) => (
                  <div key={item.slug} className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link href={`/tracks/${item.slug}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      {item.lessons.length > 0 && (
                        <span className="text-xs text-slate-500">
                          <Icon name="book" className="mr-1 h-3 w-3" />Bài học:{" "}
                          {item.lessons.map((l, k) => (
                            <span key={l.slug}>
                              {k > 0 && " · "}
                              <Link href={`/tracks/${item.slug}/learn/${l.slug}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
                                {l.title}
                              </Link>
                            </span>
                          ))}
                        </span>
                      )}
                      {item.read.length > 0 && (
                        <span className="text-xs text-slate-500">
                          Đọc:{" "}
                          {item.read.map((r, k) => (
                            <span key={r.anchor}>
                              {k > 0 && " · "}
                              <Link href={`/tracks/${item.slug}#${r.anchor}`} className="text-blue-700 hover:underline dark:text-blue-400">
                                {r.title}
                              </Link>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1.5">
                      {item.questions.map((q) => {
                        const r = progress[q.id]?.r;
                        return (
                          <li key={q.id} className="flex items-start gap-2 text-sm">
                            <span
                              title={r === undefined ? "chưa chấm" : RATINGS[r].label}
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r === undefined ? "bg-slate-300 dark:bg-slate-700" : RATINGS[r].className}`}
                            />
                            <span className="shrink-0">
                              <LevelBadge level={q.level} />
                            </span>
                            <Link href={`/tracks/${q.slug}#${q.id}`} className="hover:text-blue-700 hover:underline dark:hover:text-blue-400">
                              <Markdown inline>{q.q}</Markdown>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { RichQuestion } from "@/lib/types";
import { LEVELS, LEVEL_LABELS, type Level } from "@/lib/constants";
import { useProgress } from "@/lib/progress";
import { QuestionCard } from "./QuestionCard";

type Filter = "all" | "essential" | "unrated" | "weak";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  essential: "⭐ Trọng điểm",
  unrated: "Chưa chấm",
  weak: "Còn yếu (≤1)",
};

export function QuestionList({ questions }: { questions: RichQuestion[] }) {
  const progress = useProgress();
  const [levels, setLevels] = useState<Set<Level>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions
      .map((q, i) => ({ q, index: i + 1 }))
      .filter(({ q }) => levels.size === 0 || levels.has(q.level))
      .filter(({ q }) => {
        const r = progress[q.id]?.r;
        if (filter === "essential") return q.essential;
        if (filter === "unrated") return r === undefined;
        if (filter === "weak") return r !== undefined && r <= 1;
        return true;
      })
      .filter(({ q }) => !needle || `${q.q} ${q.tags?.join(" ") ?? ""}`.toLowerCase().includes(needle));
  }, [questions, levels, filter, query, progress]);

  const toggle = (l: Level) =>
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });

  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        Chưa có câu hỏi cho track này — xem <code>PROGRESS.md</code> để biết tiến độ.
      </p>
    );
  }

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-10 -mx-4 space-y-2 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const n = questions.filter((q) => q.level === l).length;
            if (!n) return null;
            return (
              <button key={l} type="button" className={pill(levels.has(l))} onClick={() => toggle(l)}>
                {LEVEL_LABELS[l]} ({n})
              </button>
            );
          })}
          <span className="mx-1 w-px bg-zinc-300 dark:bg-zinc-700" />
          {(["all", "essential", "unrated", "weak"] as const).map((f) => (
            <button key={f} type="button" className={pill(filter === f)} onClick={() => setFilter(f)}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Lọc câu hỏi trong track…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          Showing {visible.length} / {questions.length}
        </p>
      </div>
      <div className="space-y-3">
        {visible.map(({ q, index }) => (
          <QuestionCard key={q.id} q={q} index={index} />
        ))}
      </div>
    </div>
  );
}

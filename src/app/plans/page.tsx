import type { Metadata } from "next";
import Link from "next/link";
import { getStudyPlans } from "@/lib/content";
import { PlanProgress } from "./PlanProgress";

export const metadata: Metadata = { title: "Study plans" };

export default function PlansPage() {
  const plans = getStudyPlans();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Lộ trình ôn tập</h1>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
          Học nhanh các phần trọng điểm theo quỹ thời gian bạn có. Mỗi ngày gồm: phần overview cần đọc, bộ câu{" "}
          <strong>⭐ trọng điểm</strong> (must-know) của từng track, và nút luyện đúng bộ câu đó. Tiến độ tính theo số câu bạn tự
          chấm <strong>≥ 3 (Solid)</strong>.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Link
            key={p.id}
            href={`/plans/${p.id}`}
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-sky-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700"
          >
            <h2 className="text-lg font-semibold group-hover:text-sky-700 dark:group-hover:text-sky-400">{p.title}</h2>
            <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">{p.summary}</p>
            <p className="text-xs text-zinc-500">
              {p.days.length} {p.days.length > 1 ? "ngày/buổi" : "buổi"} · {p.totalQuestions} câu trọng điểm
            </p>
            <PlanProgress ids={p.days.flatMap((d) => d.questionIds)} />
          </Link>
        ))}
      </div>
    </div>
  );
}

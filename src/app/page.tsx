import Link from "next/link";
import { getRoadmap, getStats, getStudyPlans } from "@/lib/content";
import { StatusBadge } from "@/components/Badges";
import { OverallProgress, TrackProgress } from "@/components/ProgressBar";

export default function Home() {
  const roadmap = getRoadmap();
  const stats = getStats();
  const plans = getStudyPlans();

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Senior Full-stack Interview Roadmap</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Từ nền tảng (networking, JS runtime) tới system design và behavioral. Mỗi track gồm study notes và bộ câu hỏi
          phỏng vấn Easy → Senior, có gợi ý trả lời, follow-up và red flags. Đi theo thứ tự tier, hoặc nhảy thẳng vào{" "}
          <Link href="/practice" className="text-sky-600 underline">
            Practice
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-6 text-sm">
          <Stat label="Tracks" value={stats.tracks} />
          <Stat label="Questions" value={stats.questions} />
          <Stat label="Tracks drafted" value={`${stats.drafted}/${stats.tracks}`} />
        </div>
        <div className="max-w-md">
          <OverallProgress total={stats.questions} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Học nhanh phần trọng điểm</h2>
          <Link href="/random" className="text-sm text-sky-700 hover:underline dark:text-sky-400">
            🎲 Hoặc bốc một câu ngẫu nhiên →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <Link
              key={p.id}
              href={`/plans/${p.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700"
            >
              <h3 className="font-medium group-hover:text-sky-700 dark:group-hover:text-sky-400">{p.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{p.summary}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {p.days.length} {p.days.length > 1 ? "ngày/buổi" : "buổi"} · {p.totalQuestions} câu ⭐
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ol className="space-y-10">
        {roadmap.map((tier) => (
          <li key={tier.id} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
                {tier.id}
              </span>
              <div>
                <h2 className="text-xl font-semibold">{tier.title}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{tier.description}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tier.tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tracks/${t.slug}`}
                  className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-400">{t.id.slice(0, 2)}</span>
                    <div className="flex gap-1">
                      {t.cvLinked && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          CV
                        </span>
                      )}
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <h3 className="font-medium leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-400">{t.title}</h3>
                  <p className="line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{t.summary}</p>
                  <p className="text-xs text-zinc-500">
                    {t.total} questions
                    {t.total > 0 && ` · ${t.byLevel.easy}E ${t.byLevel.medium}M ${t.byLevel.hard}H ${t.byLevel.senior}S`}
                  </p>
                  <TrackProgress slug={t.slug} total={t.total} />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

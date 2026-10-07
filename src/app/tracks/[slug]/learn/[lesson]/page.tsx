import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLessonParams, getLesson } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { QuestionCard } from "@/components/QuestionCard";
import { StatusBadge, VerifyChip } from "@/components/Badges";
import { readingMinutes } from "@/lib/constants";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessonParams();
}

export async function generateMetadata(props: PageProps<"/tracks/[slug]/learn/[lesson]">): Promise<Metadata> {
  const { slug, lesson } = await props.params;
  const data = getLesson(slug, lesson);
  return { title: data ? `${data.lesson.title} · ${data.track.title}` : "Lesson", description: data?.lesson.summary };
}

export default async function LessonPage(props: PageProps<"/tracks/[slug]/learn/[lesson]">) {
  const { slug, lesson: lessonSlug } = await props.params;
  const data = getLesson(slug, lessonSlug);
  if (!data) notFound();
  const { track, lesson, sections, questions, prev, next } = data;
  const toc = sections.filter((s) => s.depth === 2 || s.depth === 3);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link href={`/tracks/${track.slug}#lessons`} className="text-sm text-slate-500 hover:underline">
          ← {track.title} · Bài học
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-slate-500">
            {track.id.slice(0, 2)}.{String(lesson.order).padStart(2, "0")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
          <StatusBadge status={lesson.status} />
          {lesson.verify && <VerifyChip />}
        </div>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">{lesson.summary}</p>
        <p className="text-xs text-slate-500">
          ~{readingMinutes(lesson.words)} phút đọc · {questions.length} câu tự kiểm tra
        </p>
      </header>

      <details className="rounded-lg border border-slate-200 p-3 text-sm lg:hidden dark:border-slate-800">
        <summary className="cursor-pointer font-medium">Mục lục</summary>
        <Toc toc={toc} />
      </details>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-8">
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Markdown anchors>{lesson.body}</Markdown>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mục lục</p>
            <Toc toc={toc} />
          </div>
        </aside>
      </div>

      {questions.length > 0 && (
        <section id="tu-kiem-tra" className="scroll-mt-16 space-y-3">
          <h2 className="text-2xl font-semibold">Tự kiểm tra</h2>
          <p className="text-sm text-slate-500">
            Trả lời thành tiếng trước khi mở gợi ý.{" "}
            <Link href={`/practice?ids=${questions.map((q) => q.id).join(",")}`} className="text-blue-700 hover:underline dark:text-blue-400">
              Practice {questions.length} câu này →
            </Link>
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard key={q.id} q={q} index={i + 1} onTrackPage={false} />
            ))}
          </div>
        </section>
      )}

      {(lesson.references.length > 0 || lesson.notionRefs.length > 0) && (
        <section className="grid gap-6 text-sm sm:grid-cols-2">
          {[
            { title: "Tài liệu tham khảo", links: lesson.references },
            { title: "Personal notes (Notion)", links: lesson.notionRefs },
          ]
            .filter((g) => g.links.length > 0)
            .map((g) => (
              <div key={g.title} className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{g.title}</h2>
                <ul className="space-y-1">
                  {g.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-400">
                        {l.title} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}

      <nav className="flex justify-between gap-4 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {prev ? (
          <Link href={`/tracks/${track.slug}/learn/${prev.slug}`} className="hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <Link href={`/tracks/${track.slug}`} className="hover:underline">
            ← {track.title}
          </Link>
        )}
        {next ? (
          <Link href={`/tracks/${track.slug}/learn/${next.slug}`} className="text-right hover:underline">
            {next.title} →
          </Link>
        ) : (
          <Link href={`/tracks/${track.slug}#questions`} className="text-right hover:underline">
            Toàn bộ câu hỏi của track →
          </Link>
        )}
      </nav>
    </div>
  );
}

function Toc({ toc }: { toc: { anchor: string; title: string; depth: 2 | 3 }[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {toc.map((s) => (
        <li key={s.anchor} className={s.depth === 3 ? "pl-3 text-xs" : ""}>
          <a href={`#${s.anchor}`} className="text-slate-600 hover:text-blue-700 hover:underline dark:text-slate-400 dark:hover:text-blue-400">
            {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

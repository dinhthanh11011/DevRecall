import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getLessons, getNeighbours, getTrack, getTrackData } from "@/lib/content";
import { readingMinutes } from "@/lib/constants";
import { Markdown } from "@/components/Markdown";
import { QuestionList } from "@/components/QuestionList";
import { StatusBadge, VerifyChip } from "@/components/Badges";
import { TrackProgress } from "@/components/ProgressBar";
import { Icon } from "@/components/Icon";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/tracks/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const track = getTrack(slug);
  return { title: track?.title ?? "Track", description: track?.summary };
}

export default async function TrackPage(props: PageProps<"/tracks/[slug]">) {
  const { slug } = await props.params;
  const track = getTrack(slug);
  const data = getTrackData(slug);
  if (!track || !data) notFound();
  const { prev, next } = getNeighbours(slug);
  const lessons = getLessons(slug);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Roadmap
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-slate-500">{track.id.slice(0, 2)}</span>
          <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
          <StatusBadge status={track.status} />
        </div>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">{track.summary}</p>
        <div className="max-w-md">
          <TrackProgress slug={track.slug} total={track.questions.length} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/practice?tracks=${track.slug}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
          >
            Practice this track
          </Link>
          <Link
            href={`/random?tracks=${track.slug}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Icon name="shuffle" className="mr-1.5 h-4 w-4" />Random câu hỏi
          </Link>
          <a href="#questions" className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700">
            Jump to questions ({track.questions.length})
          </a>
        </div>
      </header>

      {lessons.length > 0 && (
        <section id="lessons" className="scroll-mt-16 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold"><Icon name="book" className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />Bài học</h2>
            <span className="text-xs text-slate-500">
              {lessons.length} bài · ~{readingMinutes(lessons.reduce((n, l) => n + l.words, 0))} phút đọc. Học theo thứ tự, rồi làm câu hỏi.
            </span>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {lessons.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/tracks/${track.slug}/learn/${l.slug}`}
                  className="block h-full rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{String(l.order).padStart(2, "0")}</span>
                    <span>~{readingMinutes(l.words)} phút</span>
                    {l.questions > 0 && <span>· {l.questions} câu</span>}
                    {l.verify && <VerifyChip />}
                  </div>
                  <p className="font-medium">{l.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{l.summary}</p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {lessons.length > 0 && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Tóm tắt & cheat sheet của track</p>
        )}
        <Markdown anchors>{track.overview}</Markdown>
      </section>

      {(track.references.length > 0 || track.notionRefs.length > 0) && (
        <section className="grid gap-6 sm:grid-cols-2">
          {track.references.length > 0 && (
            <LinkList title="References" links={track.references} />
          )}
          {track.notionRefs.length > 0 && (
            <LinkList
              title="Personal notes (Notion)"
              note="Ghi chú cá nhân — có thể sai hoặc lỗi thời, dùng để tham khảo."
              links={track.notionRefs}
            />
          )}
        </section>
      )}

      <section id="questions" className="scroll-mt-16 space-y-4">
        <h2 className="text-2xl font-semibold">Interview Questions</h2>
        <QuestionList questions={data.questions} />
      </section>

      <nav className="flex justify-between gap-4 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        {prev ? (
          <Link href={`/tracks/${prev.slug}`} className="hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tracks/${next.slug}`} className="text-right hover:underline">
            {next.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}

function LinkList({ title, note, links }: { title: string; note?: string; links: { title: string; url: string }[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {note && <p className="text-xs text-slate-500">{note}</p>}
      <ul className="space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-400">
              {l.title} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

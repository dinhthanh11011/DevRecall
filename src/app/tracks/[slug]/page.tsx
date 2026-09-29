import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getNeighbours, getTrack, getTrackData } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { QuestionList } from "@/components/QuestionList";
import { StatusBadge } from "@/components/Badges";
import { TrackProgress } from "@/components/ProgressBar";

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

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Roadmap
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-zinc-400">{track.id.slice(0, 2)}</span>
          <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
          <StatusBadge status={track.status} />
        </div>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">{track.summary}</p>
        <div className="max-w-md">
          <TrackProgress slug={track.slug} total={track.questions.length} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/practice?tracks=${track.slug}`}
            className="rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700"
          >
            Practice this track
          </Link>
          <Link
            href={`/random?tracks=${track.slug}`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            🎲 Random câu hỏi
          </Link>
          <a href="#questions" className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700">
            Jump to questions ({track.questions.length})
          </a>
        </div>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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

      <nav className="flex justify-between gap-4 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {note && <p className="text-xs text-zinc-500">{note}</p>}
      <ul className="space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-400">
              {l.title} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

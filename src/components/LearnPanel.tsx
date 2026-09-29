"use client";

import { useState } from "react";
import type { LearnMatch, Section } from "@/lib/types";
import { Markdown } from "./Markdown";

/**
 * "Kiến thức liên quan": the overview rows/bullets that teach this question, the full section on demand,
 * and links into the track page. `sections` is optional (the track page already shows the overview).
 */
export function LearnPanel({
  refs,
  slug,
  trackTitle,
  sections,
  references,
  samePage = false,
}: {
  refs: LearnMatch[];
  slug: string;
  trackTitle?: string;
  sections?: Section[];
  references?: { title: string; url: string }[];
  /** On the track page itself: link to `#anchor` instead of `/tracks/<slug>#anchor`. */
  samePage?: boolean;
}) {
  const [full, setFull] = useState(false);
  const primary = refs[0];
  const href = (anchor: string) => (samePage ? `#${anchor}` : `/tracks/${slug}#${anchor}`);
  const section = primary && sections?.find((s) => s.anchor === primary.anchor);

  return (
    <section className="space-y-3 rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/30">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">📖 Kiến thức liên quan</h4>
        {primary ? (
          <a href={href(primary.anchor)} className="text-xs text-sky-700 hover:underline dark:text-sky-400">
            {trackTitle ? `${trackTitle} › ` : ""}
            {primary.title} →
          </a>
        ) : (
          <a href={samePage ? "#" : `/tracks/${slug}`} className="text-xs text-sky-700 hover:underline dark:text-sky-400">
            Đọc overview của {trackTitle ?? "track"} →
          </a>
        )}
      </div>

      {primary && (full && section ? <Markdown compact>{section.markdown}</Markdown> : primary.excerpt && <Markdown compact>{primary.excerpt}</Markdown>)}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {section && section.markdown.length > (primary.excerpt?.length ?? 0) + 40 && (
          <button type="button" onClick={() => setFull((f) => !f)} className="text-sky-700 underline dark:text-sky-400">
            {full ? "Chỉ xem phần liên quan" : "Xem cả section"}
          </button>
        )}
        {refs.slice(1).map((r) => (
          <a key={r.anchor} href={href(r.anchor)} className="text-zinc-600 hover:underline dark:text-zinc-400">
            Xem thêm: {r.title}
          </a>
        ))}
      </div>

      {references && references.length > 0 && (
        <div className="space-y-1 border-t border-sky-200 pt-2 text-xs dark:border-sky-900">
          <span className="text-zinc-500">Tài liệu gốc:</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {references.slice(0, 4).map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-400">
                  {l.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

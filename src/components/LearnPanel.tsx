"use client";

import { useState } from "react";
import type { LearnMatch, LearnRef, Section } from "@/lib/types";
import { sectionHref } from "@/lib/sections";
import { Markdown } from "./Markdown";
import { Icon } from "./Icon";

/**
 * "Kiến thức liên quan": the overview/lesson rows, bullets or paragraphs that teach this question, the full
 * section on demand, and links into the track page or the lesson. `sections` is optional (the track page already shows the overview).
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
  /** On the track page itself: link overview sections as `#anchor` instead of `/tracks/<slug>#anchor`. */
  samePage?: boolean;
}) {
  const [full, setFull] = useState(false);
  const primary = refs[0];
  const href = (r: LearnRef) => (samePage && !r.lesson ? `#${r.anchor}` : sectionHref(slug, r));
  const label = (r: LearnRef) => (r.lesson ? `${r.lessonTitle ?? r.lesson} › ${r.title}` : r.title);
  const section = primary && sections?.find((s) => s.anchor === primary.anchor && s.lesson === primary.lesson);

  return (
    <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300"><Icon name="bookOpen" className="mr-1.5 h-3.5 w-3.5" />Kiến thức liên quan</h4>
        {primary ? (
          <a href={href(primary)} className="text-xs text-blue-700 hover:underline dark:text-blue-400">
            {trackTitle ? `${trackTitle} › ` : ""}
            {label(primary)} →
          </a>
        ) : (
          <a href={samePage ? "#" : `/tracks/${slug}`} className="text-xs text-blue-700 hover:underline dark:text-blue-400">
            Đọc overview của {trackTitle ?? "track"} →
          </a>
        )}
      </div>

      {primary && (full && section ? <Markdown compact>{section.markdown}</Markdown> : primary.excerpt && <Markdown compact>{primary.excerpt}</Markdown>)}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {section && section.markdown.length > (primary.excerpt?.length ?? 0) + 40 && (
          <button type="button" onClick={() => setFull((f) => !f)} className="text-blue-700 underline dark:text-blue-400">
            {full ? "Chỉ xem phần liên quan" : "Xem cả section"}
          </button>
        )}
        {refs.slice(1).map((r) => (
          <a key={`${r.lesson}#${r.anchor}`} href={href(r)} className="text-slate-600 hover:underline dark:text-slate-400">
            Xem thêm: {label(r)}
          </a>
        ))}
      </div>

      {references && references.length > 0 && (
        <div className="space-y-1 border-t border-blue-200 pt-2 text-xs dark:border-blue-900">
          <span className="text-slate-500">Tài liệu gốc:</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {references.slice(0, 4).map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-400">
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

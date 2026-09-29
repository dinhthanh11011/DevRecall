"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Question } from "@/lib/schema";
import { LEVELS, LEVEL_LABELS, type Level } from "@/lib/constants";
import { RATINGS, rate, useProgress, type ProgressMap, type Rating } from "@/lib/progress";
import { Chip, LevelBadge } from "@/components/Badges";
import { Markdown } from "@/components/Markdown";
import { Answer, RatingButtons } from "@/components/QuestionCard";

type TierOption = { id: number; title: string; tracks: { slug: string; title: string; total: number }[] };
type Pool = "all" | "unrated" | "weak" | "not-strong";
type Card = Question & { slug: string; trackTitle: string };

const POOLS: { value: Pool; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "unrated", label: "Chưa chấm" },
  { value: "weak", label: "Còn yếu (≤1)" },
  { value: "not-strong", label: "Chưa vững (≤2)" },
];

function inPool(pool: Pool, progress: ProgressMap, id: string) {
  const r = progress[id]?.r;
  if (pool === "unrated") return r === undefined;
  if (pool === "weak") return r !== undefined && r <= 1;
  if (pool === "not-strong") return r === undefined || r <= 2;
  return true;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PracticeSession({ tiers }: { tiers: TierOption[] }) {
  const progress = useProgress();
  const searchParams = useSearchParams();
  // Preselect from ?tracks=a,b
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((searchParams.get("tracks") ?? "").split(",").filter(Boolean)),
  );
  const [levels, setLevels] = useState<Set<Level>>(new Set());
  const [pool, setPool] = useState<Pool>("not-strong");
  const [size, setSize] = useState(10);
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const allSlugs = tiers.flatMap((t) => t.tracks.map((x) => x.slug));

  async function start() {
    const slugs = selected.size ? [...selected] : allSlugs;
    setLoading(true);
    setError(undefined);
    try {
      const data = await Promise.all(
        slugs.map((s) =>
          fetch(`/data/${s}`).then((r) => {
            if (!r.ok) throw new Error(`Failed to load ${s}`);
            return r.json() as Promise<{ slug: string; title: string; questions: Question[] }>;
          }),
        ),
      );
      const cards = data.flatMap((t) => t.questions.map((q) => ({ ...q, slug: t.slug, trackTitle: t.title })));
      const filtered = cards.filter(
        (c) => (levels.size === 0 || levels.has(c.level)) && inPool(pool, progress, c.id),
      );
      setDeck(shuffle(filtered).slice(0, size));
      setPos(0);
      setRevealed(false);
      setResults({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const card = deck?.[pos];

  const advance = useCallback(() => {
    setRevealed(false);
    setPos((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // `record` = bookkeeping after a rating was stored; `grade` also stores it (keyboard path).
  const record = useCallback(
    (r: Rating) => {
      if (!card) return;
      setResults((prev) => ({ ...prev, [card.id]: r }));
      advance();
    },
    [card, advance],
  );
  const grade = useCallback(
    (r: Rating) => {
      if (!card) return;
      rate(card.id, r);
      record(r);
    },
    [card, record],
  );

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && /^[0-4]$/.test(e.key)) {
        grade(Number(e.key) as Rating);
      } else if (e.key.toLowerCase() === "s") {
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, revealed, grade, advance]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  if (!deck) {
    return (
      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">
            Tracks <span className="font-normal text-zinc-500">({selected.size ? `${selected.size} selected` : "all"})</span>
          </legend>
          {allSlugs.length === 0 && <p className="text-sm text-zinc-500">Chưa có track nào có câu hỏi.</p>}
          {tiers
            .filter((t) => t.tracks.length)
            .map((tier) => (
              <div key={tier.id} className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{tier.title}</p>
                <div className="flex flex-wrap gap-2">
                  {tier.tracks.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      className={pill(selected.has(t.slug))}
                      onClick={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(t.slug)) next.delete(t.slug);
                          else next.add(t.slug);
                          return next;
                        })
                      }
                    >
                      {t.title} ({t.total})
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Levels</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                className={pill(levels.has(l))}
                onClick={() =>
                  setLevels((prev) => {
                    const next = new Set(prev);
                    if (next.has(l)) next.delete(l);
                    else next.add(l);
                    return next;
                  })
                }
              >
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Pool</legend>
          <div className="flex flex-wrap gap-2">
            {POOLS.map((p) => (
              <button key={p.value} type="button" className={pill(pool === p.value)} onClick={() => setPool(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Session size</legend>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 50].map((n) => (
              <button key={n} type="button" className={pill(size === n)} onClick={() => setSize(n)}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="button"
          disabled={loading || allSlugs.length === 0}
          onClick={start}
          className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Start session"}
        </button>
      </div>
    );
  }

  if (!card) {
    const graded = Object.values(results);
    const avg = graded.length ? graded.reduce((a: number, b) => a + b, 0) / graded.length : 0;
    const weak = deck.filter((c) => results[c.id] !== undefined && results[c.id] <= 1);
    return (
      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Session done</h2>
        {deck.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Không có câu hỏi nào khớp bộ lọc — thử pool &quot;Tất cả&quot;.</p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">
            Graded {graded.length}/{deck.length} · average {avg.toFixed(1)} / 4
          </p>
        )}
        {weak.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Ôn lại các câu này</h3>
            <ul className="space-y-1 text-sm">
              {weak.map((c) => (
                <li key={c.id}>
                  <a href={`/tracks/${c.slug}#${c.id}`} className="text-sky-700 hover:underline dark:text-sky-400">
                    {c.trackTitle}: {c.q.slice(0, 100)}
                    {c.q.length > 100 ? "…" : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={start} className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700">
            New session, same settings
          </button>
          <button type="button" onClick={() => setDeck(null)} className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700">
            Change settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {pos + 1} / {deck.length} · {card.trackTitle}
        </span>
        <button type="button" onClick={() => setDeck(null)} className="underline">
          End session
        </button>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${(pos / deck.length) * 100}%` }} />
      </div>
      <article className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={card.level} />
          <Chip>{card.type}</Chip>
          {card.verify && <Chip>⚠ verify</Chip>}
          {progress[card.id] && <Chip>last: {RATINGS[progress[card.id].r].label}</Chip>}
        </div>
        <div className="text-lg font-medium">
          <Markdown>{card.q}</Markdown>
        </div>
        {card.example && <Markdown compact>{card.example}</Markdown>}
        {!revealed ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Show answer (Space)
            </button>
            <button type="button" onClick={advance} className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700">
              Skip (S)
            </button>
          </div>
        ) : (
          <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Answer q={card} />
            <RatingButtons id={card.id} onRated={record} />
          </div>
        )}
      </article>
    </div>
  );
}

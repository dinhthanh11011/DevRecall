"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LEVELS, LEVEL_LABELS, QUESTION_TYPES, type Level, type QuestionType } from "@/lib/constants";
import { RATINGS, rate, useProgress, type Rating } from "@/lib/progress";
import { loadTrack, slugOf } from "@/lib/trackData";
import type { IndexEntry, RichQuestion, TrackData } from "@/lib/types";
import { Chip, EssentialBadge, LevelBadge, VerifyChip } from "@/components/Badges";
import { LearnPanel } from "@/components/LearnPanel";
import { Markdown } from "@/components/Markdown";
import { Answer, RatingButtons } from "@/components/QuestionCard";
import { Icon } from "@/components/Icon";

type TierOption = { id: number; title: string; tracks: { slug: string; title: string }[] };
type Pool = "all" | "unrated" | "weak" | "not-strong";
type Current = { q: RichQuestion; track: TrackData };

const POOLS: { value: Pool; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "unrated", label: "Chưa chấm" },
  { value: "weak", label: "Còn yếu (≤1)" },
  { value: "not-strong", label: "Chưa vững (≤2)" },
];

const FILTER_KEY = "devrecall:random-filters:v1";
type Saved = { tracks: string[]; levels: Level[]; types: QuestionType[]; pool: Pool; essentialOnly: boolean };

function list(param: string | null) {
  return (param ?? "").split(",").filter(Boolean);
}

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function RandomPicker({ index, tiers }: { index: IndexEntry[]; tiers: TierOption[] }) {
  const progress = useProgress();
  const searchParams = useSearchParams();
  const titles = useMemo(() => new Map(tiers.flatMap((t) => t.tracks.map((x) => [x.slug, x.title]))), [tiers]);

  // useSearchParams makes this subtree client-rendered, so reading storage in initializers is safe.
  const [saved] = useState<Saved | null>(() => {
    if (searchParams.get("tracks") || searchParams.get("levels")) return null;
    try {
      const raw = window.localStorage.getItem(FILTER_KEY);
      return raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      return null;
    }
  });
  const [tracks, setTracks] = useState<Set<string>>(() => new Set(saved?.tracks ?? list(searchParams.get("tracks"))));
  const [levels, setLevels] = useState<Set<Level>>(() => new Set(saved?.levels ?? (list(searchParams.get("levels")) as Level[])));
  const [types, setTypes] = useState<Set<QuestionType>>(() => new Set(saved?.types ?? []));
  const [pool, setPool] = useState<Pool>(saved?.pool ?? "all");
  const [essentialOnly, setEssentialOnly] = useState(saved?.essentialOnly ?? false);

  const [current, setCurrent] = useState<Current | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    try {
      const s: Saved = { tracks: [...tracks], levels: [...levels], types: [...types], pool, essentialOnly };
      window.localStorage.setItem(FILTER_KEY, JSON.stringify(s));
    } catch {
      // Storage unavailable: filters just won't be remembered.
    }
  }, [tracks, levels, types, pool, essentialOnly]);

  const candidates = useMemo(
    () =>
      index.filter((e) => {
        if (tracks.size && !tracks.has(e.slug)) return false;
        if (levels.size && !levels.has(e.level)) return false;
        if (types.size && !types.has(e.type)) return false;
        if (essentialOnly && !e.essential) return false;
        const r = progress[e.id]?.r;
        if (pool === "unrated") return r === undefined;
        if (pool === "weak") return r !== undefined && r <= 1;
        if (pool === "not-strong") return r === undefined || r <= 2;
        return true;
      }),
    [index, tracks, levels, types, essentialOnly, pool, progress],
  );

  const display = useCallback((id: string, track: TrackData) => {
    setLoading(false);
    const q = track.questions.find((x) => x.id === id);
    if (!q) {
      setError(`Question ${id} not found`);
      return;
    }
    setError(undefined);
    setCurrent({ q, track });
    setRevealed(false);
    setGraded(null);
    seen.current.add(id);
    setHistory((h) => [id, ...h.filter((x) => x !== id)].slice(0, 12));
    const url = new URL(window.location.href);
    url.searchParams.set("q", id);
    window.history.replaceState(null, "", url);
  }, []);

  const fail = useCallback((e: unknown) => {
    setLoading(false);
    setError((e as Error).message);
  }, []);

  const show = useCallback(
    (id: string) => {
      setLoading(true);
      loadTrack(slugOf(id)).then((track) => display(id, track), fail);
    },
    [display, fail],
  );

  const pick = useCallback(() => {
    if (!candidates.length) {
      setNotice("Không có câu nào khớp bộ lọc. Nới bộ lọc ra nhé.");
      return;
    }
    let fresh = candidates.filter((e) => !seen.current.has(e.id) && e.id !== current?.q.id);
    if (!fresh.length) {
      seen.current.clear();
      fresh = candidates.filter((e) => e.id !== current?.q.id);
      setNotice(`Đã đi hết ${candidates.length} câu khớp bộ lọc, bắt đầu vòng mới.`);
    } else {
      setNotice(undefined);
    }
    if (!fresh.length) fresh = candidates;
    show(fresh[Math.floor(Math.random() * fresh.length)].id);
  }, [candidates, current, show]);

  // Deep link: /random?q=<id>
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const id = searchParams.get("q");
    if (id && index.some((e) => e.id === id)) loadTrack(slugOf(id)).then((track) => display(id, track), fail);
  }, [searchParams, index, display, fail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "r" || k === "n") pick();
      else if (e.key === " " && current && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (current && revealed && /^[0-4]$/.test(e.key)) {
        const r = Number(e.key) as Rating;
        rate(current.q.id, r);
        setGraded(r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick, current, revealed]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${
      active
        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const filterCount = tracks.size + levels.size + types.size + (pool !== "all" ? 1 : 0) + (essentialOnly ? 1 : 0);
  const q = current?.q;

  return (
    <div className="space-y-6">
      <details
        open={!current}
        className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm">
          <span className="font-semibold">
            Bộ lọc{" "}
            <span className="font-normal text-slate-500">
              {filterCount ? `(${filterCount} đang bật)` : "(tất cả)"} · {candidates.length} câu khớp
            </span>
          </span>
          <span className="text-slate-500 group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-5 border-t border-slate-100 p-4 dark:border-slate-800">
          <fieldset className="space-y-3">
            <legend className="flex items-center gap-2 text-sm font-semibold">
              Topic
              <button type="button" className={pill(tracks.size === 0)} onClick={() => setTracks(new Set())}>
                All
              </button>
            </legend>
            {tiers
              .filter((t) => t.tracks.length)
              .map((tier) => {
                const all = tier.tracks.every((t) => tracks.has(t.slug));
                return (
                  <div key={tier.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setTracks((prev) => {
                          const next = new Set(prev);
                          for (const t of tier.tracks) {
                            if (all) next.delete(t.slug);
                            else next.add(t.slug);
                          }
                          return next;
                        })
                      }
                      className={`text-xs uppercase tracking-wide hover:underline ${all ? "text-blue-700 dark:text-blue-400" : "text-slate-500"}`}
                      title="Chọn / bỏ cả tier"
                    >
                      {tier.id} · {tier.title}
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {tier.tracks.map((t) => (
                        <button
                          key={t.slug}
                          type="button"
                          className={pill(tracks.has(t.slug))}
                          onClick={() => setTracks((prev) => toggled(prev, t.slug))}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Level</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pill(levels.size === 0)} onClick={() => setLevels(new Set())}>
                All
              </button>
              {LEVELS.map((l) => (
                <button key={l} type="button" className={pill(levels.has(l))} onClick={() => setLevels((p) => toggled(p, l))}>
                  {LEVEL_LABELS[l]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Loại câu hỏi</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pill(types.size === 0)} onClick={() => setTypes(new Set())}>
                All
              </button>
              {QUESTION_TYPES.map((t) => (
                <button key={t} type="button" className={pill(types.has(t))} onClick={() => setTypes((p) => toggled(p, t))}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-8">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Theo tiến độ</legend>
              <div className="flex flex-wrap gap-2">
                {POOLS.map((p) => (
                  <button key={p.value} type="button" className={pill(pool === p.value)} onClick={() => setPool(p.value)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Trọng điểm</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={pill(!essentialOnly)} onClick={() => setEssentialOnly(false)}>
                  Tất cả câu
                </button>
                <button type="button" className={pill(essentialOnly)} onClick={() => setEssentialOnly(true)}>
                  <Icon name="star" className="mr-1 h-3 w-3 text-yellow-500" />Chỉ trọng điểm
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {!loading && <Icon name="shuffle" className="mr-2 h-4 w-4" />}
          {loading ? "Loading…" : current ? "Câu khác (R)" : "Bốc câu hỏi (R)"}
        </button>
        <span className="text-sm text-slate-500">{candidates.length} câu khớp bộ lọc</span>
      </div>
      {notice && <p className="text-sm text-amber-700 dark:text-amber-400">{notice}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {current && q && (
        <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/tracks/${current.track.slug}`} className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400">
              {current.track.title}
            </Link>
            <LevelBadge level={q.level} />
            <Chip>{q.type}</Chip>
            {q.essential && <EssentialBadge />}
            {q.verify && <VerifyChip />}
            {progress[q.id] && <Chip>last: {RATINGS[progress[q.id].r].label}</Chip>}
            <span className="ml-auto font-mono text-xs text-slate-500">{q.id}</span>
          </div>
          <div className="text-lg font-medium">
            <Markdown>{q.q}</Markdown>
          </div>
          {q.example && <Markdown compact>{q.example}</Markdown>}
          {!revealed ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Show answer (Space)
              </button>
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
              >
                Chưa biết — học luôn
              </button>
            </div>
          ) : (
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Answer q={q} />
              <LearnPanel
                refs={q.refs}
                slug={current.track.slug}
                trackTitle={current.track.title}
                sections={current.track.sections}
                references={current.track.references}
              />
              <RatingButtons id={q.id} onRated={setGraded} />
              {graded !== null && (
                <p className="text-sm text-slate-500">
                  Đã chấm {graded} · {RATINGS[graded].label}. Nhấn <kbd>R</kbd> để bốc câu tiếp.
                </p>
              )}
            </div>
          )}
        </article>
      )}

      {history.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vừa bốc</h2>
          <ul className="space-y-1 text-sm">
            {history.slice(1).map((id) => {
              const r = progress[id]?.r;
              return (
                <li key={id} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${r === undefined ? "bg-slate-300 dark:bg-slate-700" : RATINGS[r].className}`}
                  />
                  <button type="button" onClick={() => show(id)} className="text-left text-blue-700 hover:underline dark:text-blue-400">
                    {titles.get(slugOf(id)) ?? slugOf(id)} · <span className="font-mono text-xs">{id}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

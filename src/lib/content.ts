import "server-only";
import { cache } from "react";
import { readAllTracks, readLessons, readRoadmap, readStudyPlans } from "./load";
import { LEVELS, type Lesson, type Level, type Track } from "./schema";
import { createMatcher, splitSections, type LearnRef, type Section } from "./sections";
import type { IndexEntry, RichQuestion, SearchEntry, TrackData } from "./types";

export type { SearchEntry } from "./types";

export type TrackSummary = Pick<
  Track,
  "id" | "slug" | "title" | "tier" | "status" | "summary" | "cvLinked"
> & { total: number; byLevel: Record<Level, number> };


/** A lesson without its body, for lists. */
export type LessonSummary = Pick<Lesson, "slug" | "order" | "title" | "summary" | "status" | "words" | "verify"> & {
  questions: number;
};

const loadAll = cache(() => {
  const tracks = readAllTracks();
  const lessons = new Map(tracks.map((t) => [t.id, readLessons(t.id)]));
  return {
    tracks,
    lessons,
    bySlug: new Map(tracks.map((t) => [t.slug, t])),
    byId: new Map(tracks.map((t) => [t.id, t])),
  };
});

/** Lessons that are written (planned stubs are hidden from learners). */
function readyLessons(t: Track): Lesson[] {
  return (loadAll().lessons.get(t.id) ?? []).filter((l) => l.status !== "planned");
}

const lessonSections = (l: Lesson) => splitSections(l.body, { slug: l.slug, title: l.title });

/**
 * Track + overview sections + per-question "learn more" refs (over the overview and its lessons).
 * `sections` carries the overview plus only the lesson sections some question links to, to keep the JSON small.
 */
const richTrack = cache((slug: string): TrackData | undefined => {
  const t = loadAll().bySlug.get(slug);
  if (!t) return undefined;
  const overview = splitSections(t.overview);
  const lessons = readyLessons(t);
  const fromLessons = lessons.flatMap(lessonSections);
  const match = createMatcher([...overview, ...fromLessons]);
  const listedIn = new Map<string, string[]>();
  for (const l of lessons) for (const id of l.questions) listedIn.set(id, [...(listedIn.get(id) ?? []), l.slug]);
  const essentials = new Set(t.essentials);
  const questions: RichQuestion[] = t.questions.map((q) => ({
    ...q,
    refs: match({ ...q, lessons: listedIn.get(q.id) }),
    essential: essentials.has(q.id),
  }));
  const used = new Set(questions.flatMap((q) => q.refs.slice(0, 1).map((r) => `${r.lesson}#${r.anchor}`)));
  const sections: Section[] = [...overview, ...fromLessons.filter((s) => used.has(`${s.lesson}#${s.anchor}`))];
  return { id: t.id, slug: t.slug, title: t.title, sections, references: t.references, questions };
});

const summarizeLesson = (l: Lesson): LessonSummary => ({
  slug: l.slug,
  order: l.order,
  title: l.title,
  summary: l.summary,
  status: l.status,
  words: l.words,
  verify: l.verify,
  questions: l.questions.length,
});

export function getLessons(slug: string): LessonSummary[] {
  const t = loadAll().bySlug.get(slug);
  return t ? readyLessons(t).map(summarizeLesson) : [];
}

/** Every (track, lesson) pair, for static params. */
export function getAllLessonParams(): { slug: string; lesson: string }[] {
  return loadAll().tracks.flatMap((t) => readyLessons(t).map((l) => ({ slug: t.slug, lesson: l.slug })));
}

/** One lesson with its "Tự kiểm tra" questions and prev/next lessons. */
export function getLesson(slug: string, lessonSlug: string) {
  const t = loadAll().bySlug.get(slug);
  const data = getTrackData(slug);
  if (!t || !data) return undefined;
  const lessons = readyLessons(t);
  const i = lessons.findIndex((l) => l.slug === lessonSlug);
  if (i < 0) return undefined;
  const lesson = lessons[i];
  const byId = new Map(data.questions.map((q) => [q.id, q]));
  return {
    track: { slug: t.slug, title: t.title, id: t.id },
    lesson,
    sections: lessonSections(lesson),
    questions: lesson.questions.flatMap((id) => byId.get(id) ?? []),
    prev: lessons[i - 1] && summarizeLesson(lessons[i - 1]),
    next: lessons[i + 1] && summarizeLesson(lessons[i + 1]),
  };
}

export function getTrackData(slug: string): TrackData | undefined {
  return richTrack(slug);
}

/** Every question in roadmap order, without the heavy fields. */
export function getQuestionIndex(): IndexEntry[] {
  const { byId } = loadAll();
  return readRoadmap().tiers.flatMap((tier) =>
    tier.tracks.flatMap((id) => {
      const t = byId.get(id);
      if (!t) return [];
      const essentials = new Set(t.essentials);
      return t.questions.map((q) => ({
        id: q.id,
        slug: t.slug,
        tier: tier.id,
        level: q.level,
        type: q.type,
        essential: essentials.has(q.id),
      }));
    }),
  );
}

export type PlanQuestion = { id: string; slug: string; level: Level; q: string };
export type PlanItem = {
  slug: string;
  title: string;
  read: LearnRef[];
  lessons: { slug: string; title: string }[];
  questions: PlanQuestion[];
};
export type ResolvedPlan = {
  id: string;
  title: string;
  summary: string;
  intro: string;
  days: { title: string; goal: string; items: PlanItem[]; questionIds: string[] }[];
  totalQuestions: number;
};

const DEFAULT_READ = ["tl;dr", "cheat sheet"];

export const getStudyPlans = cache((): ResolvedPlan[] => {
  const { byId } = loadAll();
  return readStudyPlans().plans.map((plan) => {
    const days = plan.days.map((day) => {
      const items: PlanItem[] = day.items.flatMap((item) => {
        const t = byId.get(item.track);
        if (!t) return [];
        const sections = splitSections(t.overview);
        const wanted = (item.read ?? DEFAULT_READ).map((h) => h.trim().toLowerCase());
        const read = wanted.flatMap((h) => {
          const s = sections.find((x) => x.title.trim().toLowerCase() === h);
          return s ? [{ anchor: s.anchor, title: s.title }] : [];
        });
        const ids = [...t.essentials.slice(0, item.take ?? t.essentials.length), ...(item.extra ?? [])];
        const questions = ids.flatMap((id) => {
          const q = t.questions.find((x) => x.id === id);
          return q ? [{ id: q.id, slug: t.slug, level: q.level, q: q.q }] : [];
        });
        const ready = readyLessons(t);
        const lessons = (item.lessons ?? []).flatMap((ls) => {
          const l = ready.find((x) => x.slug === ls);
          return l ? [{ slug: l.slug, title: l.title }] : [];
        });
        return [{ slug: t.slug, title: t.title, read, lessons, questions }];
      });
      return { title: day.title, goal: day.goal, items, questionIds: items.flatMap((i) => i.questions.map((q) => q.id)) };
    });
    return { ...plan, days, totalQuestions: days.reduce((n, d) => n + d.questionIds.length, 0) };
  });
});

export function getStudyPlan(id: string): ResolvedPlan | undefined {
  return getStudyPlans().find((p) => p.id === id);
}

function summarize(t: Track): TrackSummary {
  const byLevel = Object.fromEntries(
    LEVELS.map((l) => [l, t.questions.filter((q) => q.level === l).length]),
  ) as Record<Level, number>;
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    tier: t.tier,
    status: t.status,
    summary: t.summary,
    cvLinked: t.cvLinked,
    total: t.questions.length,
    byLevel,
  };
}

export function getRoadmap() {
  const { byId } = loadAll();
  return readRoadmap().tiers.map((tier) => ({
    ...tier,
    tracks: tier.tracks.flatMap((id) => {
      const t = byId.get(id);
      return t ? [summarize(t)] : [];
    }),
  }));
}

export function getTrack(slug: string): Track | undefined {
  return loadAll().bySlug.get(slug);
}

export function getAllSlugs(): string[] {
  return loadAll().tracks.map((t) => t.slug);
}

export function getStats() {
  const { tracks } = loadAll();
  return {
    tracks: tracks.length,
    questions: tracks.reduce((n, t) => n + t.questions.length, 0),
    drafted: tracks.filter((t) => t.status !== "planned").length,
  };
}

/** Questions plus lesson sections (heading + a short snippet, not the full text, to keep the page light). */
export function getSearchIndex(): SearchEntry[] {
  return loadAll().tracks.flatMap((t): SearchEntry[] => [
    ...readyLessons(t).flatMap((l) =>
      lessonSections(l).map((s) => ({
        kind: "lesson" as const,
        id: `${t.slug}/${l.slug}#${s.anchor}`,
        slug: t.slug,
        track: t.title,
        href: `/tracks/${t.slug}/learn/${l.slug}#${s.anchor}`,
        title: `${l.title} › ${s.title}`,
        snippet: snippetOf(s.markdown),
      })),
    ),
    ...t.questions.map((q) => ({
      kind: "question" as const,
      id: q.id,
      slug: t.slug,
      track: t.title,
      level: q.level,
      q: q.q,
      tags: q.tags ?? [],
    })),
  ]);
}

function snippetOf(markdown: string): string {
  const text = markdown
    .split("\n")
    .slice(1)
    .join(" ")
    .replace(/(```|~~~)[\s\S]*?\1/g, " ")
    .replace(/[`*_>#|]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
}

/** Neighbours in roadmap order, for prev/next links. */
export function getNeighbours(slug: string) {
  const order = getRoadmap().flatMap((tier) => tier.tracks);
  const i = order.findIndex((t) => t.slug === slug);
  return { prev: order[i - 1], next: order[i + 1] };
}

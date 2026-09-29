import "server-only";
import { cache } from "react";
import { readAllTracks, readRoadmap, readStudyPlans } from "./load";
import { LEVELS, type Level, type Track } from "./schema";
import { createMatcher, splitSections, type LearnRef } from "./sections";
import type { IndexEntry, RichQuestion, TrackData } from "./types";

export type TrackSummary = Pick<
  Track,
  "id" | "slug" | "title" | "tier" | "status" | "summary" | "cvLinked"
> & { total: number; byLevel: Record<Level, number> };

export type SearchEntry = {
  id: string;
  slug: string;
  track: string;
  level: Level;
  q: string;
  tags: string[];
};

const loadAll = cache(() => {
  const tracks = readAllTracks();
  return { tracks, bySlug: new Map(tracks.map((t) => [t.slug, t])), byId: new Map(tracks.map((t) => [t.id, t])) };
});

/** Track + overview sections + per-question "learn more" refs. */
const richTrack = cache((slug: string): TrackData | undefined => {
  const t = loadAll().bySlug.get(slug);
  if (!t) return undefined;
  const sections = splitSections(t.overview);
  const match = createMatcher(sections);
  const essentials = new Set(t.essentials);
  const questions: RichQuestion[] = t.questions.map((q) => ({ ...q, refs: match(q), essential: essentials.has(q.id) }));
  return { id: t.id, slug: t.slug, title: t.title, sections, references: t.references, questions };
});

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
export type PlanItem = { slug: string; title: string; read: LearnRef[]; questions: PlanQuestion[] };
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
        return [{ slug: t.slug, title: t.title, read, questions }];
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

export function getSearchIndex(): SearchEntry[] {
  return loadAll().tracks.flatMap((t) =>
    t.questions.map((q) => ({ id: q.id, slug: t.slug, track: t.title, level: q.level, q: q.q, tags: q.tags ?? [] })),
  );
}

/** Neighbours in roadmap order, for prev/next links. */
export function getNeighbours(slug: string) {
  const order = getRoadmap().flatMap((tier) => tier.tracks);
  const i = order.findIndex((t) => t.slug === slug);
  return { prev: order[i - 1], next: order[i + 1] };
}

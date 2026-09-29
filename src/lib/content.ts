import "server-only";
import { cache } from "react";
import { readAllTracks, readRoadmap } from "./load";
import { LEVELS, type Level, type Track } from "./schema";

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

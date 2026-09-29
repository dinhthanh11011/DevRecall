"use client";

import type { TrackData } from "./types";

// One request per track per page load; Practice and Random share it.
const cache = new Map<string, Promise<TrackData>>();

export function loadTrack(slug: string): Promise<TrackData> {
  let p = cache.get(slug);
  if (!p) {
    p = fetch(`/data/${slug}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${slug}`);
      return r.json() as Promise<TrackData>;
    });
    p.catch(() => cache.delete(slug));
    cache.set(slug, p);
  }
  return p;
}

/** `caching-012` → `caching`. */
export function slugOf(id: string): string {
  return id.replace(/-\d{3}$/, "");
}

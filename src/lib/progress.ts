"use client";

import { useSyncExternalStore } from "react";

/** 0 = blank, 1 = weak, 2 = partial, 3 = solid, 4 = strong. */
export type Rating = 0 | 1 | 2 | 3 | 4;
export type Entry = { r: Rating; t: number; n: number };
export type ProgressMap = Record<string, Entry>;

export const RATINGS: { value: Rating; label: string; hint: string; className: string }[] = [
  { value: 0, label: "Blank", hint: "Không biết / quên hẳn", className: "bg-rose-600" },
  { value: 1, label: "Weak", hint: "Nhớ mang máng, sai ý chính", className: "bg-orange-500" },
  { value: 2, label: "Partial", hint: "Đúng cơ chế, thiếu trade-off/ví dụ", className: "bg-amber-400" },
  { value: 3, label: "Solid", hint: "Cơ chế + trade-off + ví dụ", className: "bg-emerald-500" },
  { value: 4, label: "Strong", hint: "Thêm failure modes, số liệu, kinh nghiệm thật", className: "bg-sky-500" },
];

const KEY = "devrecall:progress:v1";
const EMPTY: ProgressMap = {};
const listeners = new Set<() => void>();
let snapshot: ProgressMap | null = null;

function read(): ProgressMap {
  if (snapshot) return snapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    snapshot = raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    snapshot = {};
  }
  return snapshot;
}

function write(next: ProgressMap) {
  snapshot = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota): keep in-memory only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snapshot = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function rate(id: string, r: Rating) {
  const prev = read()[id];
  write({ ...read(), [id]: { r, t: Date.now(), n: (prev?.n ?? 0) + 1 } });
}

export function clearRating(id: string) {
  const next = { ...read() };
  delete next[id];
  write(next);
}

export function resetAll() {
  write({});
}

export function exportJson(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), progress: read() }, null, 2);
}

export function importJson(text: string): number {
  const data = JSON.parse(text) as { progress?: ProgressMap };
  if (!data.progress || typeof data.progress !== "object") throw new Error("Not a DevRecall export file");
  const merged = { ...read() };
  let count = 0;
  for (const [id, e] of Object.entries(data.progress)) {
    if (typeof e?.r !== "number" || e.r < 0 || e.r > 4) continue;
    if (!merged[id] || merged[id].t < e.t) {
      merged[id] = e;
      count++;
    }
  }
  write(merged);
  return count;
}

/** Aggregate for questions whose id starts with `${slug}-`. */
export function trackStats(progress: ProgressMap, slug: string, total: number) {
  const prefix = `${slug}-`;
  let rated = 0;
  let sum = 0;
  let weak = 0;
  for (const [id, e] of Object.entries(progress)) {
    if (!id.startsWith(prefix)) continue;
    rated++;
    sum += e.r;
    if (e.r <= 1) weak++;
  }
  return {
    rated,
    weak,
    coverage: total ? rated / total : 0,
    mastery: total ? sum / (total * 4) : 0,
  };
}

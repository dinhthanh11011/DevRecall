// Plain constants shared by server and client code (no zod here, keeps client bundles small).
export const LEVELS = ["easy", "medium", "hard", "senior", "cv"] as const;
export const QUESTION_TYPES = [
  "concept",
  "compare",
  "scenario",
  "debug",
  "design",
  "output",
  "gotcha",
  "behavioral",
  "open",
] as const;
export const TRACK_STATUSES = ["planned", "drafted", "reviewed"] as const;

export type Level = (typeof LEVELS)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  senior: "Senior probing",
  cv: "From real projects",
};

/** Reading time in minutes (~200 words per minute), at least 1. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

import { z } from "zod";

import { LEVELS, QUESTION_TYPES, TRACK_STATUSES } from "./constants";

export { LEVELS, QUESTION_TYPES, TRACK_STATUSES, LEVEL_LABELS } from "./constants";
export type { Level, QuestionType } from "./constants";

const link = z.object({
  title: z.string().min(1),
  url: z.url(),
});

export const questionSchema = z.object({
  /** Stable id, `<track-slug>-<3 digits>`. Never renumber: progress is keyed on it. */
  id: z.string().regex(/^[a-z0-9-]+-\d{3}$/),
  level: z.enum(LEVELS),
  type: z.enum(QUESTION_TYPES),
  /** The question as an interviewer would ask it. English, Markdown allowed. */
  q: z.string().min(10),
  /** Short answer hint. Vietnamese prose, English technical terms, Markdown. */
  hint: z.string().min(20),
  /** Optional code / input-output / scenario. Markdown (use fenced code blocks). */
  example: z.string().optional(),
  /** The follow-up a real interviewer asks next. English. */
  followUp: z.string().optional(),
  /** What a weak (mid-level) answer sounds like. */
  redFlags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  /** Overview heading (h2/h3 text) that teaches this; overrides the automatic "learn more" match. */
  learn: z.string().optional(),
  /** true = version-dependent or uncertain fact; needs a human fact-check. */
  verify: z.boolean().optional(),
});

export const trackSchema = z.object({
  /** `NN-slug`, must match the file name. */
  id: z.string().regex(/^\d{2}-[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  tier: z.number().int().min(0),
  status: z.enum(TRACK_STATUSES),
  /** One-line Vietnamese summary shown on the roadmap card. */
  summary: z.string().min(10),
  /** Topics a candidate claims on a CV and will be drilled on. */
  cvLinked: z.boolean().default(false),
  prerequisites: z.array(z.string()).default([]),
  /** Must-know question ids, highest priority first. Study plans take the first N. */
  essentials: z.array(z.string()).default([]),
  /** Study notes: TL;DR, core concepts, diagrams (```mermaid), cheat sheet. Markdown. */
  overview: z.string().min(50),
  notionRefs: z.array(link).default([]),
  references: z.array(link).default([]),
  questions: z.array(questionSchema),
});

export const roadmapSchema = z.object({
  tiers: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      description: z.string(),
      tracks: z.array(z.string()),
    }),
  ),
});

const planItem = z.object({
  /** Track id (`NN-slug`). */
  track: z.string(),
  /** Overview headings to read; default: the track's TL;DR and Cheat sheet. */
  read: z.array(z.string()).optional(),
  /** Take the first N of the track's `essentials` (default: all). */
  take: z.number().int().positive().optional(),
  /** Extra question ids on top of the essentials. */
  extra: z.array(z.string()).optional(),
});

export const studyPlansSchema = z.object({
  plans: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string(),
      /** One-line Vietnamese summary. */
      summary: z.string(),
      /** Who it is for / how to use it. Markdown. */
      intro: z.string(),
      days: z.array(
        z.object({
          title: z.string(),
          /** What to focus on and how to study it. Markdown. */
          goal: z.string(),
          items: z.array(planItem).min(1),
        }),
      ),
    }),
  ),
});

export type Question = z.infer<typeof questionSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type StudyPlans = z.infer<typeof studyPlansSchema>;

/** Minimum question counts for a track to be considered complete. */
export const TARGETS = { total: 40, perLevel: { easy: 6, medium: 10, hard: 8, senior: 3, cv: 0 } } as const;

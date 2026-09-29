// Client-safe shapes derived from content (no zod, no fs).
import type { Level, QuestionType } from "./constants";
import type { Question } from "./schema";
import type { LearnMatch, Section } from "./sections";

export type { LearnMatch, LearnRef, Section } from "./sections";

/** A question plus the overview sections that teach it. */
export type RichQuestion = Question & { refs: LearnMatch[]; essential: boolean };

/** Payload of `/data/<slug>`. */
export type TrackData = {
  id: string;
  slug: string;
  title: string;
  sections: Section[];
  references: { title: string; url: string }[];
  questions: RichQuestion[];
};

/** One row of the lightweight index used by /random to pick without loading every track. */
export type IndexEntry = {
  id: string;
  slug: string;
  tier: number;
  level: Level;
  type: QuestionType;
  essential: boolean;
};

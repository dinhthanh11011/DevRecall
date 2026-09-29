// Plain-Node content loader shared by the app (server side) and the scripts.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  lessonFrontmatterSchema,
  roadmapSchema,
  studyPlansSchema,
  trackSchema,
  type Lesson,
  type Roadmap,
  type StudyPlans,
  type Track,
} from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");
export const TRACKS_DIR = path.join(CONTENT_DIR, "tracks");
export const LESSONS_DIR = path.join(CONTENT_DIR, "lessons");

export class ContentError extends Error {}

export function readRoadmap(): Roadmap {
  const raw = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, "roadmap.yaml"), "utf8"));
  return roadmapSchema.parse(raw);
}

export function readStudyPlans(): StudyPlans {
  const raw = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, "study-plans.yaml"), "utf8"));
  return studyPlansSchema.parse(raw);
}

export function trackFiles(): string[] {
  if (!fs.existsSync(TRACKS_DIR)) return [];
  return fs
    .readdirSync(TRACKS_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .sort();
}

export function readTrackFile(file: string): Track {
  const full = path.join(TRACKS_DIR, file);
  let raw: unknown;
  try {
    raw = YAML.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    throw new ContentError(`${file}: invalid YAML: ${(e as Error).message}`);
  }
  const parsed = trackSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new ContentError(`${file}: schema errors\n${issues}`);
  }
  const track = parsed.data;
  if (`${track.id}.yaml` !== file) {
    throw new ContentError(`${file}: id "${track.id}" must match file name`);
  }
  return track;
}

export function readAllTracks(): Track[] {
  return trackFiles().map(readTrackFile);
}

/** Prose words of a Markdown body (code blocks excluded), for size targets and reading time. */
export function countWords(markdown: string): number {
  return markdown
    .replace(/(```|~~~)[\s\S]*?\1/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Track ids that have a `content/lessons/<id>/` folder. */
export function lessonTrackIds(): string[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Lessons of one track, in file-name order (`NN-slug.md`). */
export function readLessons(trackId: string): Lesson[] {
  const dir = path.join(LESSONS_DIR, trackId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const where = `lessons/${trackId}/${file}`;
      const name = file.match(/^(\d{2})-([a-z0-9-]+)\.md$/);
      if (!name) throw new ContentError(`${where}: file name must be NN-slug.md`);
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
      if (!fm) throw new ContentError(`${where}: missing --- frontmatter ---`);
      let raw: unknown;
      try {
        raw = YAML.parse(fm[1]);
      } catch (e) {
        throw new ContentError(`${where}: invalid frontmatter YAML: ${(e as Error).message}`);
      }
      const parsed = lessonFrontmatterSchema.safeParse(raw);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
        throw new ContentError(`${where}: frontmatter errors\n${issues}`);
      }
      const body = text.slice(fm[0].length).trim();
      return { ...parsed.data, slug: name[2], order: Number(name[1]), trackId, body, words: countWords(body) };
    });
}

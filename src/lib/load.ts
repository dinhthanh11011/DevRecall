// Plain-Node content loader shared by the app (server side) and the scripts.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { roadmapSchema, trackSchema, type Roadmap, type Track } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");
export const TRACKS_DIR = path.join(CONTENT_DIR, "tracks");

export class ContentError extends Error {}

export function readRoadmap(): Roadmap {
  const raw = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, "roadmap.yaml"), "utf8"));
  return roadmapSchema.parse(raw);
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

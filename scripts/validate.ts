// Validates content/. Usage: npm run validate [-- --track 05-nodejs]
import { readRoadmap, readTrackFile, trackFiles, ContentError } from "../src/lib/load";
import { LEVELS, TARGETS, type Track } from "../src/lib/schema";

const args = process.argv.slice(2);
const only = args.includes("--track") ? args[args.indexOf("--track") + 1] : undefined;

const errors: string[] = [];
const warnings: string[] = [];
const tracks: Track[] = [];

const files = trackFiles().filter((f) => !only || f === `${only}.yaml`);
if (only && files.length === 0) errors.push(`no file content/tracks/${only}.yaml`);

for (const file of files) {
  try {
    tracks.push(readTrackFile(file));
  } catch (e) {
    if (e instanceof ContentError) errors.push(e.message);
    else throw e;
  }
}

const seen = new Map<string, string>();
for (const t of tracks) {
  for (const q of t.questions) {
    if (!q.id.startsWith(`${t.slug}-`)) errors.push(`${t.id}: question id ${q.id} must start with "${t.slug}-"`);
    const prev = seen.get(q.id);
    if (prev) errors.push(`duplicate question id ${q.id} (${prev} and ${t.id})`);
    seen.set(q.id, t.id);
  }
  if (t.status !== "planned") {
    const counts = Object.fromEntries(LEVELS.map((l) => [l, t.questions.filter((q) => q.level === l).length]));
    if (t.questions.length < TARGETS.total)
      warnings.push(`${t.id}: ${t.questions.length} questions (< ${TARGETS.total} target)`);
    for (const l of LEVELS) {
      const min = TARGETS.perLevel[l];
      if (counts[l] < min) warnings.push(`${t.id}: ${counts[l]} ${l} (< ${min})`);
    }
  }
}

if (!only) {
  try {
    const roadmap = readRoadmap();
    const ids = new Set(tracks.map((t) => t.id));
    const listed = roadmap.tiers.flatMap((tier) => tier.tracks);
    for (const id of listed) if (!ids.has(id)) errors.push(`roadmap.yaml lists "${id}" but content/tracks/${id}.yaml is missing`);
    for (const id of ids) if (!listed.includes(id)) warnings.push(`${id} is not listed in roadmap.yaml`);
  } catch (e) {
    errors.push(`roadmap.yaml: ${(e as Error).message}`);
  }
}

const total = tracks.reduce((n, t) => n + t.questions.length, 0);
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`\n${tracks.length} track(s), ${total} question(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

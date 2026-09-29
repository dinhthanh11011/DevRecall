// Validates content/. Usage: npm run validate [-- --track 05-nodejs]
import { readRoadmap, readStudyPlans, readTrackFile, trackFiles, ContentError } from "../src/lib/load";
import { splitSections } from "../src/lib/sections";
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
  const ids = new Set(t.questions.map((q) => q.id));
  const headings = new Set(splitSections(t.overview).map((s) => s.title.trim().toLowerCase()));
  for (const e of t.essentials) if (!ids.has(e)) errors.push(`${t.id}: essentials lists unknown id ${e}`);
  if (new Set(t.essentials).size !== t.essentials.length) errors.push(`${t.id}: duplicate id in essentials`);
  for (const q of t.questions)
    if (q.learn && !headings.has(q.learn.trim().toLowerCase()))
      errors.push(`${q.id}: learn "${q.learn}" matches no h2/h3 heading in the overview`);
  if (t.status !== "planned" && t.essentials.length === 0) warnings.push(`${t.id}: no essentials (must-know list)`);
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

if (!only) {
  try {
    const byId = new Map(tracks.map((t) => [t.id, t]));
    const planIds = new Set<string>();
    for (const plan of readStudyPlans().plans) {
      if (planIds.has(plan.id)) errors.push(`study-plans.yaml: duplicate plan id ${plan.id}`);
      planIds.add(plan.id);
      for (const [d, day] of plan.days.entries())
        for (const item of day.items) {
          const where = `study-plans.yaml ${plan.id} day ${d + 1}`;
          const t = byId.get(item.track);
          if (!t) {
            errors.push(`${where}: unknown track ${item.track}`);
            continue;
          }
          const headings = new Set(splitSections(t.overview).map((s) => s.title.trim().toLowerCase()));
          for (const h of item.read ?? [])
            if (!headings.has(h.trim().toLowerCase())) errors.push(`${where}: ${t.id} has no heading "${h}"`);
          for (const x of item.extra ?? [])
            if (!t.questions.some((q) => q.id === x)) errors.push(`${where}: ${t.id} has no question ${x}`);
        }
    }
  } catch (e) {
    errors.push(`study-plans.yaml: ${(e as Error).message}`);
  }
}

const total = tracks.reduce((n, t) => n + t.questions.length, 0);
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`\n${tracks.length} track(s), ${total} question(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);

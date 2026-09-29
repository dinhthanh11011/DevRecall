// Validates content/. Usage: npm run validate [-- --track 05-nodejs] (--lessons <id> is an alias)
import {
  lessonTrackIds,
  readLessons,
  readRoadmap,
  readStudyPlans,
  readTrackFile,
  trackFiles,
  ContentError,
} from "../src/lib/load";
import { findSection, splitSections, type Section } from "../src/lib/sections";
import { LESSON_TARGETS, LEVELS, TARGETS, type Lesson, type Track } from "../src/lib/schema";

const args = process.argv.slice(2);
const flag = args.find((a) => a === "--track" || a === "--lessons");
const only = flag ? args[args.indexOf(flag) + 1] : undefined;

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

// --- Lessons (content/lessons/<track-id>/NN-slug.md) ------------------------------------------
const trackIds = new Set(trackFiles().map((f) => f.replace(/\.yaml$/, "")));
const lessonsByTrack = new Map<string, Lesson[]>();
const fold = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
for (const id of lessonTrackIds().filter((id) => !only || id === only)) {
  if (!trackIds.has(id)) {
    errors.push(`content/lessons/${id}/ has no matching content/tracks/${id}.yaml`);
    continue;
  }
  try {
    lessonsByTrack.set(id, readLessons(id));
  } catch (e) {
    if (e instanceof ContentError) errors.push(e.message);
    else throw e;
  }
}
for (const t of tracks) {
  const lessons = lessonsByTrack.get(t.id) ?? [];
  const ids = new Set(t.questions.map((q) => q.id));
  const slugs = new Set<string>();
  const orders = new Set<number>();
  for (const l of lessons) {
    const where = `lessons/${t.id}/${String(l.order).padStart(2, "0")}-${l.slug}.md`;
    if (slugs.has(l.slug)) errors.push(`${where}: duplicate lesson slug "${l.slug}"`);
    if (orders.has(l.order)) errors.push(`${where}: duplicate order ${l.order}`);
    slugs.add(l.slug);
    orders.add(l.order);
    for (const q of l.questions) if (!ids.has(q)) errors.push(`${where}: questions lists ${q}, which is not in ${t.id}`);
    if (l.status === "planned") continue;
    const h2 = splitSections(l.body)
      .filter((s) => s.depth === 2)
      .map((s) => fold(s.title));
    let at = -1;
    for (const want of LESSON_TARGETS.headings) {
      const i = h2.indexOf(fold(want));
      if (i < 0) errors.push(`${where}: missing "## ${want}"`);
      else if (i < at) errors.push(`${where}: "## ${want}" is out of order`);
      else at = i;
    }
    if (h2.includes(fold("Tự kiểm tra"))) warnings.push(`${where}: don't write "## Tự kiểm tra"; it's rendered from questions:`);
    if (l.words < LESSON_TARGETS.minWords) warnings.push(`${where}: ${l.words} words (< ${LESSON_TARGETS.minWords})`);
    if (!/```(?!mermaid)[a-z]*\n/.test(l.body)) warnings.push(`${where}: no code/example block`);
    if (!l.noDiagram && !l.body.includes("```mermaid")) warnings.push(`${where}: no mermaid diagram (set noDiagram: true if none fits)`);
    for (const m of l.body.matchAll(/```mermaid\n([\s\S]*?)```/g))
      if (/^\s*sequenceDiagram/.test(m[1]))
        for (const line of m[1].split("\n"))
          if (/(->>|-->>|->|-->|-x|--x|Note )/.test(line) && line.includes(";"))
            errors.push(`${where}: ";" in a sequenceDiagram line breaks Mermaid: ${line.trim()}`);
    if (l.questions.length < 3) warnings.push(`${where}: only ${l.questions.length} questions: (aim for 4–12)`);
  }
}

/** Sections `learn:` and plans can point at: the overview plus written lessons. */
function sectionsOf(t: Track): Section[] {
  return [
    ...splitSections(t.overview),
    ...(lessonsByTrack.get(t.id) ?? [])
      .filter((l) => l.status !== "planned")
      .flatMap((l) => splitSections(l.body, { slug: l.slug, title: l.title })),
  ];
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
  const sections = sectionsOf(t);
  for (const e of t.essentials) if (!ids.has(e)) errors.push(`${t.id}: essentials lists unknown id ${e}`);
  if (new Set(t.essentials).size !== t.essentials.length) errors.push(`${t.id}: duplicate id in essentials`);
  for (const q of t.questions)
    if (q.learn && findSection(sections, q.learn) < 0)
      errors.push(`${q.id}: learn "${q.learn}" matches no h2/h3 heading in the overview or a written lesson`);
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
          for (const ls of item.lessons ?? []) {
            const l = lessonsByTrack.get(t.id)?.find((x) => x.slug === ls);
            if (!l) errors.push(`${where}: ${t.id} has no lesson "${ls}"`);
            else if (l.status === "planned") warnings.push(`${where}: lesson ${t.id}/${ls} is still planned (hidden)`);
          }
          for (const x of item.extra ?? [])
            if (!t.questions.some((q) => q.id === x)) errors.push(`${where}: ${t.id} has no question ${x}`);
        }
    }
  } catch (e) {
    errors.push(`study-plans.yaml: ${(e as Error).message}`);
  }
}

const total = tracks.reduce((n, t) => n + t.questions.length, 0);
const allLessons = [...lessonsByTrack.values()].flat();
const written = allLessons.filter((l) => l.status !== "planned").length;
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  `\n${tracks.length} track(s), ${total} question(s), ${allLessons.length} lesson(s) (${written} written), ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);

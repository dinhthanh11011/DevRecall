@AGENTS.md

# DevRecall

A senior full-stack interview prep app: a zero-to-hero roadmap of tracks, each with study notes and a question bank. Next.js 16 (App Router) + Tailwind v4. Content lives in YAML under `content/`.

## Start every session with
1. Read `PROGRESS.md` (state, next steps, work log).
2. Content work: follow `docs/CONTENT_GUIDE.md` exactly. The sample track is `content/tracks/03-javascript.yaml`.
3. Code work: Next 16 differs from older versions. Check `node_modules/next/dist/docs/` before using an API.

## Layout
- `content/roadmap.yaml`: tiers → track ids (the learning order).
- `content/tracks/<NN-slug>.yaml`: one track: overview (Markdown) + `essentials` (must-know ids) + questions.
- `content/lessons/<track-id>/NN-slug.md`: theory lessons (frontmatter + Markdown), see `docs/CONTENT_GUIDE.md §9`.
- `content/study-plans.yaml`: review plans (1 day / 7 days / 3 weeks) built from `essentials`.
- `src/lib/schema.ts`: zod schema (the single source of truth for content shape).
- `src/lib/load.ts`: fs loader (used by the app at build time and by scripts).
- `src/lib/content.ts`: app-facing queries (server only).
- `src/lib/sections.ts`: splits overviews into anchored sections and matches each question to the rows/bullets that teach it ("Kiến thức liên quan").
- `src/app/`: routes: `/`, `/tracks/[slug]`, `/tracks/[slug]/learn/[lesson]`, `/plans`, `/plans/[id]`, `/random`, `/practice` (`?tracks=`, `?ids=`), `/progress`, `/search`, `/data/[slug]` (static JSON).
- `scripts/validate.ts`, `scripts/progress.ts`.

## Commands
- `npm run dev` · `npm run build` (runs validate first) · `npm run lint`
- `npm run validate [-- --track <id>]`: schema, id uniqueness, roadmap consistency, count targets
- `npm run progress`: regenerates the stats table in `PROGRESS.md`

## Rules
- Never renumber or reuse question ids (user progress is keyed on them).
- After content changes: `npm run validate`, then `npm run progress`, then a Work log line in `PROGRESS.md`.
- Personal Notion notes (`notionRefs`) are references, not truth. Verify against official docs, and log contradictions in `PROGRESS.md › Notion corrections`. Never write to Notion from this repo's workflows.
- Mark version-dependent or uncertain facts with `verify: true`.
- Don't commit or push unless the user asks.

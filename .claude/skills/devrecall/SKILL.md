---
name: devrecall
description: Work on the DevRecall interview-prep repo. Use when continuing the build ("continue", "next track", "what's left"), writing or extending a track's questions, fact-checking/reviewing a track, adding app features, or running a mock interview from the repo's question bank.
---

# DevRecall

State lives in files, not in chat history, so any new window can continue from them.

## Always start here
1. Read `PROGRESS.md`: content stats, batches, app feature checklist, work log, Notion corrections.
2. Run `npm run validate` to confirm the current state is clean.
3. Say in one line what you'll do next, then do it.

## Mode: continue / write content
- Pick the next item from `PROGRESS.md`: a `planned` track, a `drafted` track under target, or an unchecked feature.
- Follow `docs/CONTENT_GUIDE.md` exactly (schema, language split, targets, card format). The sample is `content/tracks/03-javascript.yaml`.
- Never renumber question ids. New questions take the next free number.
- Keep each track's `essentials:` list (8–10 must-know ids, priority order) current. Don't rename overview headings casually: `learn:` and `content/study-plans.yaml` reference them.
- Big files: write in chunks (Write the first part, then append with a Bash heredoc), and validate after each chunk.
- Run `npm run validate -- --track <id>` until it reports 0 errors and 0 warnings, then `npm run progress`, then add a Work log line (ISO date · what · next).

## Mode: review / fact-check a track
- Read the track and check every `verify: true` item, and anything that looks off, against official docs. For Next.js, use `node_modules/next/dist/docs/`.
- Fix or delete wrong hints (a deleted id stays retired). Remove `verify` once a fact is confirmed.
- Only a human flips `status: reviewed`. Propose it; don't set it on your own.
- Personal Notion notes (`notionRefs`) are references, not truth. Log contradictions under `PROGRESS.md › Notion corrections`. Never write to Notion.

## Mode: mock interview
- Ask for the tracks, the level (default: senior mix) and the length (default: 10).
- Load questions from `content/tracks/*.yaml`. Ask **one at a time** and hide the hint.
- After each answer: a 0–4 grade (0 blank · 1 weak · 2 mechanics only · 3 + trade-offs & example · 4 + failure modes, numbers, real experience), what was missing, then the card's `followUp`, going at most 2 levels deep.
- Mix in ~30% `cv`-level and `99-project-deep-dive` questions.
- At the end: scores, the top 3 weak spots with their track and question ids, and a suggestion to practice those in `/practice`.

## Mode: app features
- Next 16 has breaking changes. Read `node_modules/next/dist/docs/` before using an API.
- After a change: `npx tsc --noEmit`, `npm run lint`, `npm run build`, then tick the checklist in `PROGRESS.md`.

Don't commit or push unless the user asks.

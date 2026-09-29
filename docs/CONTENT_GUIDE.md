# Content Guide

How to write a DevRecall track. Every contributor, human or AI, follows this. The reference example is [`content/tracks/03-javascript.yaml`](../content/tracks/03-javascript.yaml).

## 1. File & schema

- One file per track: `content/tracks/<NN-slug>.yaml`. The schema lives in [`src/lib/schema.ts`](../src/lib/schema.ts).
- Question ids are `<slug>-<NNN>` (e.g. `nodejs-017`). **Never renumber or reuse an id**, because learners' progress is keyed on it. New questions get the next free number. A deleted id stays retired.
- `status`: `planned` (stub) → `drafted` (meets targets, not fact-checked) → `reviewed` (a human fact-checked it).
- `essentials`: the track's must-know question ids (⭐ trọng điểm), **highest priority first**: 8 ids, or 10 if the track has ≥ 60 questions. Study plans take the first N, so the first 4 must be the highest-yield. Mix levels and prefer practical questions without `verify: true`.
- Check your work with `npm run validate -- --track <NN-slug>`, then `npm run progress` to refresh `PROGRESS.md`.

## 2. Language

| Field | Language |
|---|---|
| `q`, `followUp`, `redFlags` | **English**, phrased the way an interviewer asks it |
| `summary`, `overview`, `hint` | **Vietnamese prose with English technical terms** ("Cache stampede xảy ra khi…") |
| Code | TypeScript. SQL uses the PostgreSQL dialect, with a note when SQL Server differs |

## 3. Targets per track

- **Broad tracks** (Node, React, Next.js, SQL, Caching, Kafka, Security, Auth, System Design, AWS): **50–70 questions**.
- **Narrow tracks**: **40+ questions** (validator minimum: 40 total, ≥6 easy, ≥10 medium, ≥8 hard, ≥3 senior).
- Rough mix: Easy 20% · Medium 35% · Hard 25% · Senior-probing 10% · `cv` (from real projects) ~10% on CV-linked tracks.
- Each track needs **≥3 `debug` questions with a real code/config snippet** and **≥3 `scenario` questions** ("in production you see X…").

## 4. Levels

| level | Tests | Example |
|---|---|---|
| `easy` | Definition and recall, a 30-second answer | What is cache-aside? |
| `medium` | Mechanics, "compare X vs Y", why | Cache-aside vs write-through: when is each wrong? |
| `hard` | Failure modes, debugging, scale, "what happens if…" | A hot key expires and DB CPU hits 100%. Mitigations? |
| `senior` | Open-ended design and judgment, no single right answer | Design caching for a multi-tenant catalog with per-tenant prices. |
| `cv` | Anchored on a real-project claim: "You did X, prove it" | You added Redis to hot APIs. How did you invalidate on writes? |

Types: `concept · compare · scenario · debug · design · output · gotcha · behavioral · open`.

## 5. Writing a good card

- **`hint`**: 3–8 lines. Facts, mechanisms and trade-offs only. Enough to self-grade, not an essay. If the answer needs more than ~15 lines, put the depth in `overview` and summarize it in the hint.
- **`example`**: fenced code block or a concrete input/output. It's required for `debug` and `output` questions, which put the snippet here.
- **`followUp`**: the *next* question a real interviewer asks. This is what builds depth.
- **`redFlags`**: what a mid-level answer sounds like, so learners avoid it.
- **`verify: true`**: set it for any version-dependent or uncertain fact (Next.js caching defaults, React 19 APIs, Node versions, AWS limits, Kafka KRaft). Wrong hints are worse than none.
- **`learn`** (optional): the exact h2/h3 heading of the overview section that teaches this card. The app links every question to the overview automatically (BM25 over table rows and bullets, see `src/lib/sections.ts`). Set `learn` only when that automatic match is wrong.
- Prefer **production scenarios** and **gotchas** over textbook trivia. Every Easy question should lead into something deeper.
- Behavioral cards: the `hint` gives a STAR skeleton, the numbers to mention, and a reflection line.

## 6. `overview` (the study notes)

This is Markdown rendered above the questions. Structure:

1. `## TL;DR`: 3–5 bullets.
2. `## Khái niệm cốt lõi`: a table of concept → one line → a tiny example.
3. `## Cơ chế hoạt động`: **at least one ```mermaid diagram** when there's a flow, lifecycle or data movement.
4. `## Trade-offs`: a comparison table.
5. `## Pitfalls`: bullets.
6. `## Cheat sheet`: bullets for fast review.

Headings become anchors (`sec-<slug>`) that questions and study plans link to, so **renaming a heading breaks `learn` and `study-plans.yaml` references**. The validator catches this. Put the teachable facts in table rows and bullets: that's what gets excerpted under a question as *Kiến thức liên quan*.

Mermaid tips: use `flowchart TD/LR` or `sequenceDiagram`, and quote labels that contain special characters (`A["x < y"]`). In a `sequenceDiagram`, never put `;` in a message or note: it ends the statement and breaks the diagram.

## 7. Sources

- `notionRefs`: the author's personal notes (Notion). **They're personal notes and may be wrong or outdated.** Use them for context and terminology, never as the source of truth. If a note contradicts current official docs, follow the docs and record the discrepancy in `PROGRESS.md › Notion corrections`.
- `references`: official docs first (MDN, nodejs.org, react.dev, nextjs.org, postgresql.org, kafka.apache.org, AWS docs, RFCs, OWASP).
- For Next.js, the docs for the installed version live in `node_modules/next/dist/docs/`. Read them before writing Next.js content.

## 8. Study plans (`content/study-plans.yaml`)

- A plan has days, and each day lists items `{ track, take?, read?, extra? }`. `take` is the first N `essentials` (default: all), `read` is overview headings (default: TL;DR + Cheat sheet), and `extra` is additional question ids.
- The validator checks tracks, headings and ids. Keep each day at about 15–35 questions.

## 9. Lessons (full theory pages)

The `overview` is a summary. **Lessons are where the theory is taught.** Someone who has never seen the topic should be able to read a track's lessons in order and then answer its questions. The reference set is `content/lessons/13-sql-postgres/`.

### Files & frontmatter

- One file per lesson: `content/lessons/<track-id>/<NN-slug>.md`, for example `content/lessons/13-sql-postgres/03-indexes.md`. `NN` sets the order and `slug` is the URL (`/tracks/sql-postgres/learn/indexes`). **Don't rename a published slug**, because study plans and `learn:` refs point at it.
- Frontmatter (zod `lessonFrontmatterSchema` in `src/lib/schema.ts`):

```yaml
---
title: Indexes trong PostgreSQL        # Vietnamese or English, a specific name
summary: B-tree hoạt động ra sao, composite/covering/partial index, và vì sao planner bỏ qua index.
status: drafted                        # planned (stub, hidden) → drafted → reviewed (human fact-check)
questions: [sql-postgres-003, sql-postgres-018]  # cards of THIS track that the lesson teaches (4–12)
references:
  - { title: "PostgreSQL docs: Indexes", url: "https://www.postgresql.org/docs/current/indexes.html" }
notionRefs: []                         # personal notes, optional
verify: true                           # the lesson has version-dependent/uncertain facts
# noDiagram: true                      # only if no flow/structure is worth drawing
---
```

- A **`planned` stub** is frontmatter plus the outline as bullets under each heading. Writing the outline first lets the next window continue exactly where the last one stopped.

### Size & split

- 5–10 lessons per track (broad tracks: 8–12), each **≥ 1,500 words on the validator's counter** (code excluded; it counts each Vietnamese syllable, so the numbers run high). The reference set lands at 3–6K per lesson; past ~6K, split it.
- One lesson = one coherent idea a learner can finish in 10–20 minutes (e.g. "MVCC & VACUUM", not "Postgres internals"). Order lessons from foundations → mechanics → production.
- Together, the lessons of a track should cover **every question** in the track. Each question id should appear in the `questions:` of at least one lesson. `npm run progress` shows "Qs linked".

### Required outline (h2, in this order; the validator checks it)

1. `## Bối cảnh & vấn đề`: the problem that exists without this; a concrete story or a failing example first.
2. `## Khái niệm`: each concept as an `### h3` with 1–3 paragraphs of **explanation** (what it is, why it works that way) and a short example. Tables are fine as a recap *after* the prose, never as a replacement.
3. `## Cơ chế hoạt động`: step by step, with **≥ 1 ```mermaid** diagram (flowchart / sequence / state). Explain the diagram in text too.
4. `## Ví dụ thực tế`: at least one worked example with a runnable snippet **and its output** (SQL + result rows, a TS snippet + console output, a curl + response).
5. `## Trade-offs & lựa chọn thay thế`: a comparison table plus "when to pick which" in prose.
6. `## Edge cases & failure modes`: what breaks under load, bad input, crashes and concurrency.
7. `## Pitfalls`: common mistakes as bullets: ❌ the wrong thing → ✅ the right thing, and why.
8. `## Tóm tắt`: 5–8 bullets to review.

Don't write `## Tự kiểm tra`: the page renders it from `questions:`. Extra `##` sections between these are allowed when the topic needs them (e.g. `## So sánh với SQL Server`).

### Writing style: clear, complete and easy to understand

- **Define before use.** The first time a term appears, explain it in one plain sentence. Don't assume the previous lesson was read in full; link to it instead (`[MVCC](/tracks/sql-postgres/learn/mvcc-vacuum#sec-...)`).
- **Why before how.** Every mechanism answers "why is it designed this way?" and "what would go wrong otherwise?"
- **One idea per paragraph**, 2–5 sentences. Use bold for the key term, not whole sentences.
- **Concrete over abstract**: real numbers (8 KB page, 200 connections), real names (`pg_stat_activity`), and real error messages.
- Vietnamese prose with English technical terms, as in the rest of the repo. Code in TypeScript, and SQL in the PostgreSQL dialect.
- Connect to interviews: end key subsections with a short "**Interview angle:**" line saying what an interviewer probes here.

### Sources

- Official docs first (see §7). Use the author's Notion pages (see `notionRefs` and the Notion map) as a **topic checklist**: every topic they cover should appear in some lesson, **explained correctly**. When a note is wrong, follow the docs and log it in `PROGRESS.md › Notion corrections`.
- Mark the lesson `verify: true` when it has version-dependent claims, and also say "(verify)" inline next to the specific claim.

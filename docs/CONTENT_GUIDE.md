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

Mermaid tips: use `flowchart TD/LR` or `sequenceDiagram`, and quote labels that contain special characters (`A["x < y"]`).

## 7. Sources

- `notionRefs`: the author's personal notes (Notion). **They're personal notes and may be wrong or outdated.** Use them for context and terminology, never as the source of truth. If a note contradicts current official docs, follow the docs and record the discrepancy in `PROGRESS.md › Notion corrections`.
- `references`: official docs first (MDN, nodejs.org, react.dev, nextjs.org, postgresql.org, kafka.apache.org, AWS docs, RFCs, OWASP).
- For Next.js, the docs for the installed version live in `node_modules/next/dist/docs/`. Read them before writing Next.js content.

## 8. Study plans (`content/study-plans.yaml`)

- A plan has days, and each day lists items `{ track, take?, read?, extra? }`. `take` is the first N `essentials` (default: all), `read` is overview headings (default: TL;DR + Cheat sheet), and `extra` is additional question ids.
- The validator checks tracks, headings and ids. Keep each day at about 15–35 questions.

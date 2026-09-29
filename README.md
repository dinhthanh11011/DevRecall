# DevRecall

A **senior full-stack interview prep** app: a zero-to-hero roadmap of 32 tracks (networking → JS/Node → React/Next.js → SQL/caching/Kafka → distributed systems → security/OIDC → AWS/DevOps → behavioral). Each track has study notes plus a question bank from Easy to Senior, with answer hints, the follow-up an interviewer will ask, and red flags.

- **Roadmap** (`/`): tiers and tracks in learning order, with your progress per track.
- **Track** (`/tracks/<slug>`): overview (Markdown, Mermaid diagrams, code) and questions you can filter by level or by "unrated"/"weak".
- **Practice** (`/practice`): flashcards. Answer out loud, reveal the hint, and self-grade 0–4 (keys: `Space`, `0`–`4`, `S`).
- **Search** (`/search`): searches every question.
- **Progress** (`/progress`): mastery per track, weak spots, and JSON export/import. Progress is stored in your browser only.

Questions are in English, the way you'll hear them in an interview. Hints and notes are in Vietnamese with English technical terms.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # validates content first, then builds static pages
```

## Content

```text
content/
  roadmap.yaml            # tiers → track ids (learning order)
  tracks/NN-slug.yaml     # one track: overview + questions
docs/CONTENT_GUIDE.md     # how to write a track (format, language, quality bar)
PROGRESS.md               # build status per track + work log (start here)
```

A question looks like this:

```yaml
- id: caching-012            # stable, never renumber
  level: hard                # easy | medium | hard | senior | cv
  type: scenario             # concept | compare | scenario | debug | design | output | gotcha | behavioral | open
  q: A hot key expires and DB CPU jumps to 100%. What happened and how do you prevent it?
  hint: |-
    Cache stampede: nhiều request cùng miss → cùng query DB…
  followUp: How does probabilistic early expiration work?
  redFlags: ["Just increase the TTL"]
  verify: true               # needs a human fact-check
```

Commands:

```bash
npm run validate                       # all content
npm run validate -- --track 16-caching # one track
npm run progress                       # refresh the stats table in PROGRESS.md
```

## Contributing

1. Read `docs/CONTENT_GUIDE.md`.
2. Edit or add a track YAML file, then run `npm run validate -- --track <id>`.
3. Run `npm run progress` and add a line to the Work log in `PROGRESS.md`.
4. Open a PR. Reviewers fact-check anything marked `verify: true` and flip a track to `status: reviewed` once it's checked.

Content is written with AI assistance and reviewed by humans. If you find something wrong, open an issue or a PR. Wrong hints are worse than none.

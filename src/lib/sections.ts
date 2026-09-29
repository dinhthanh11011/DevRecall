// Splits a track overview into heading sections and links each question to the section(s) that teach it.
// Pure functions: shared by the server (content.ts), the scripts and the Markdown heading-id plugin.

export type Section = {
  /** Anchor id used on the track page (`/tracks/<slug>#<anchor>`). */
  anchor: string;
  title: string;
  depth: 2 | 3;
  /** Heading + body up to the next h2/h3, Markdown. */
  markdown: string;
};

export type LearnRef = { anchor: string; title: string };

/** Heading text → anchor. Strips Vietnamese diacritics and Markdown punctuation. */
export function slugify(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `sec-${base || "section"}`;
}

/** Assigns unique anchors in document order; must match the Markdown plugin's order. */
export function anchorer() {
  const used = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };
}

export function splitSections(overview: string): Section[] {
  const next = anchorer();
  const sections: Section[] = [];
  let current: Section | null = null;
  let fence: string | null = null;
  for (const line of overview.split("\n")) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (line.trim().startsWith(fence)) fence = null;
    }
    const heading = !fence && !fenceMatch ? line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/) : null;
    if (heading) {
      const title = heading[2].replace(/[*_`]/g, "");
      current = { anchor: next(title), title, depth: heading[1].length as 2 | 3, markdown: line };
      sections.push(current);
    } else if (current) {
      current.markdown += `\n${line}`;
    }
  }
  for (const s of sections) s.markdown = s.markdown.trimEnd();
  return sections;
}

// --- Matching (BM25 over blocks: table rows, list items, paragraphs, code) -------------------

const STOP = new Set(
  "the a an and or of to in on for is are be it its this that with as at by from how what why when which you your do does can vs not no into than then there their they we our use using used what khi cho cac mot nhung duoc voi cua thi la va khong co de trong".split(
    " ",
  ),
);
/** Sections that summarise everything; never the best place to learn one specific idea. */
const SKIP = new Set(["tl;dr", "tldr", "cheat sheet", "khung tra loi"]);

function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

function tokens(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

type Block = { section: number; markdown: string; /** table header + separator, for rows */ head?: string };

/** Splits a section body into matchable blocks. Table rows and list items are separate blocks. */
function blocksOf(section: Section, index: number): Block[] {
  const lines = section.markdown.split("\n").slice(1);
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith(fence[1])) j++;
      out.push({ section: index, markdown: lines.slice(i, j + 1).join("\n") });
      i = j + 1;
    } else if (line.trim().startsWith("|") && lines[i + 1]?.match(/^\s*\|?\s*:?-{2,}/)) {
      const head = `${line}\n${lines[i + 1]}`;
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        out.push({ section: index, markdown: lines[j], head });
        j++;
      }
      i = j;
    } else if (/^\s*([-*+]|\d+\.)\s/.test(line)) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && /^\s{2,}\S/.test(lines[j]) && !/^\s*([-*+]|\d+\.)\s/.test(lines[j])) j++;
      out.push({ section: index, markdown: lines.slice(i, j).join("\n") });
      i = j;
    } else {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !/^\s*([-*+]|\d+\.|\||```|~~~)/.test(lines[j])) j++;
      out.push({ section: index, markdown: lines.slice(i, j).join("\n") });
      i = j;
    }
  }
  return out;
}

/** Renders chosen blocks of one section back to Markdown (table rows regain their header). */
function renderBlocks(blocks: Block[]): string {
  const parts: string[] = [];
  let table: { head: string; rows: string[] } | null = null;
  const flush = () => {
    if (table) parts.push(`${table.head}\n${table.rows.join("\n")}`);
    table = null;
  };
  for (const b of blocks) {
    if (b.head) {
      if (table && table.head === b.head) table.rows.push(b.markdown);
      else {
        flush();
        table = { head: b.head, rows: [b.markdown] };
      }
    } else {
      flush();
      parts.push(b.markdown);
    }
  }
  flush();
  return parts.join("\n\n");
}

export type MatchInput = { q: string; hint: string; tags?: string[]; learn?: string };
export type LearnMatch = LearnRef & { excerpt?: string };

/**
 * Returns up to `limit` sections most relevant to a question, best first. The first one carries an
 * `excerpt`: the few rows/bullets of that section that match best.
 * `learn` (heading text) on the question pins the section; the excerpt is still picked inside it.
 */
export function createMatcher(sections: Section[]) {
  const blocks = sections.flatMap((s, i) => (SKIP.has(fold(s.title).trim()) ? [] : blocksOf(s, i)));
  const docs = blocks.map((b) => {
    const tf = new Map<string, number>();
    const text = `${sections[b.section].title} ${b.head ? b.head.split("\n")[0] : ""} ${b.markdown}`;
    for (const t of tokens(text)) tf.set(t, (tf.get(t) ?? 0) + 1);
    const len = [...tf.values()].reduce((a, c) => a + c, 0);
    return { b, tf, len };
  });
  const avg = docs.reduce((n, d) => n + d.len, 0) / Math.max(docs.length, 1);
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length;
  const idf = (t: string) => Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));

  return (q: MatchInput, limit = 2): LearnMatch[] => {
    const weights = new Map<string, number>();
    const add = (text: string, w: number) => {
      for (const t of tokens(text)) weights.set(t, (weights.get(t) ?? 0) + w);
    };
    add(q.q, 2);
    add((q.tags ?? []).join(" "), 3);
    add(q.hint, 1);
    const k1 = 1.2;
    const b = 0.75;
    const scored = docs
      .map((d) => {
        let score = 0;
        for (const [t, w] of weights) {
          const f = d.tf.get(t);
          if (!f) continue;
          score += w * idf(t) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg)));
        }
        return { d, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, c) => c.score - a.score);

    const pinned = q.learn ? sections.findIndex((s) => fold(s.title).trim() === fold(q.learn!).trim()) : -1;
    const order: number[] = pinned >= 0 ? [pinned] : [];
    for (const x of scored) if (!order.includes(x.d.b.section)) order.push(x.d.b.section);
    if (!order.length) return [];

    const best = scored.find((x) => x.d.b.section === order[0])?.score ?? 0;
    const refs: LearnMatch[] = [];
    for (const [rank, si] of order.slice(0, limit).entries()) {
      const inSection = scored.filter((x) => x.d.b.section === si);
      if (rank > 0 && (inSection[0]?.score ?? 0) < best * 0.6) break;
      const s = sections[si];
      const ref: LearnMatch = { anchor: s.anchor, title: s.title };
      if (rank === 0 && inSection.length) {
        const top = inSection[0].score;
        const picked = new Set(inSection.filter((x) => x.score >= top * 0.5).slice(0, 4).map((x) => x.d.b));
        // Keep document order so table rows stay in their original sequence.
        ref.excerpt = renderBlocks(blocks.filter((bl) => picked.has(bl)));
      }
      refs.push(ref);
    }
    return refs;
  };
}

// --- Markdown plugin: give h2/h3 the same anchors -------------------------------------------

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

/** rehype plugin: sets `id` on h2/h3 in document order, matching `splitSections`. */
export function rehypeSectionIds() {
  return (tree: HastNode) => {
    const next = anchorer();
    const walk = (node: HastNode) => {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        node.properties = { ...node.properties, id: next(hastText(node)) };
        return;
      }
      if (node.type === "element" && node.tagName === "pre") return;
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

import { LEVEL_LABELS, type Level } from "@/lib/constants";

const LEVEL_STYLES: Record<Level, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  senior: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  cv: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[level]}`}>
      {LEVEL_LABELS[level]}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "planned" | "drafted" | "reviewed" }) {
  const style =
    status === "reviewed"
      ? "bg-emerald-600 text-white"
      : status === "drafted"
        ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
        : "border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${style}`}>{status}</span>;
}

export function EssentialBadge() {
  return (
    <span
      title="Câu trọng điểm (must-know)"
      className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
    >
      ⭐ Trọng điểm
    </span>
  );
}

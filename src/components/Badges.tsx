import { Icon } from "./Icon";
import { LEVEL_LABELS, type Level } from "@/lib/constants";

const LEVEL_STYLES: Record<Level, string> = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  senior: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  cv: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
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
    <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "planned" | "drafted" | "reviewed" }) {
  const style =
    status === "reviewed"
      ? "bg-emerald-600 text-white"
      : status === "drafted"
        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
        : "border border-dashed border-slate-300 text-slate-500 dark:border-slate-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${style}`}>{status}</span>;
}

export function EssentialBadge() {
  return (
    <span
      title="Câu trọng điểm (must-know)"
      className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
    >
      <Icon name="star" className="h-3 w-3" />
      Trọng điểm
    </span>
  );
}

export function VerifyChip() {
  return (
    <span
      title="Cần kiểm chứng lại (verify)"
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 text-xs text-amber-800 dark:border-amber-800 dark:text-amber-300"
    >
      <Icon name="alert" className="h-3 w-3" />
      verify
    </span>
  );
}

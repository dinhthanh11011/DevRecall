"use client";

import { useProgress, type ProgressMap } from "@/lib/progress";
import { Bar } from "@/components/ProgressBar";

/** A question counts as done once it is rated Solid (3) or better. */
export function doneCount(progress: ProgressMap, ids: string[]) {
  return ids.filter((id) => (progress[id]?.r ?? -1) >= 3).length;
}

export function PlanProgress({ ids, label = "câu đạt ≥ 3" }: { ids: string[]; label?: string }) {
  const progress = useProgress();
  const done = doneCount(progress, ids);
  const rated = ids.filter((id) => progress[id]).length;
  return (
    <div className="space-y-1">
      <Bar value={ids.length ? done / ids.length : 0} className="bg-emerald-500" label="Plan progress" />
      <p className="text-xs text-slate-500">
        {done}/{ids.length} {label}
        {rated > done ? ` · ${rated - done} đã chấm nhưng chưa vững` : ""}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { exportJson, importJson, resetAll, trackStats, useProgress } from "@/lib/progress";
import { Bar } from "@/components/ProgressBar";

type T = { slug: string; title: string; tier: string; total: number };

export function ProgressDashboard({ tracks }: { tracks: T[] }) {
  const progress = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>();

  const rows = tracks
    .filter((t) => t.total > 0)
    .map((t) => ({ ...t, ...trackStats(progress, t.slug, t.total) }));
  const weakest = [...rows].filter((r) => r.rated > 0).sort((a, b) => a.mastery / a.coverage - b.mastery / b.coverage).slice(0, 5);

  function download() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devrecall-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    try {
      const n = importJson(await file.text());
      setMessage(`Imported ${n} rating(s).`);
    } catch (e) {
      setMessage(`Import failed: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={download} className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700">
          Export JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700">
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Xoá toàn bộ tiến độ trong trình duyệt này? Không thể hoàn tác.")) resetAll();
          }}
          className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-600 dark:border-rose-800"
        >
          Reset
        </button>
        {message && <span className="self-center text-zinc-500">{message}</span>}
      </div>

      {weakest.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Chỗ yếu nhất (trên các câu đã chấm)</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {weakest.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/practice?tracks=${r.slug}`}
                  className="rounded-full border border-orange-300 px-3 py-1 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                >
                  {r.title} · practice
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="py-2">Track</th>
              <th className="w-24 py-2 text-right">Rated</th>
              <th className="w-20 py-2 text-right">Weak</th>
              <th className="w-48 py-2 pl-4">Mastery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.slug}>
                <td className="py-2">
                  <Link href={`/tracks/${r.slug}`} className="hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-zinc-500">{r.tier}</div>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {r.rated}/{r.total}
                </td>
                <td className="py-2 text-right tabular-nums">{r.weak || ""}</td>
                <td className="py-2 pl-4">
                  <div className="flex items-center gap-2">
                    <Bar value={r.mastery} />
                    <span className="w-10 text-right text-xs tabular-nums">{Math.round(r.mastery * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

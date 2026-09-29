import type { Metadata } from "next";
import { Suspense } from "react";
import { getRoadmap } from "@/lib/content";
import { PracticeSession } from "./PracticeSession";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  const tiers = getRoadmap().map((tier) => ({
    id: tier.id,
    title: tier.title,
    tracks: tier.tracks.filter((t) => t.total > 0).map((t) => ({ slug: t.slug, title: t.title, total: t.total })),
  }));
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Flashcard mode: đọc câu hỏi, <strong>tự trả lời thành tiếng</strong> (như đang phỏng vấn), rồi mới mở gợi ý và tự
          chấm 0–4. Phím tắt: <kbd>Space</kbd> mở đáp án, <kbd>0</kbd>–<kbd>4</kbd> chấm điểm, <kbd>S</kbd> bỏ qua.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <PracticeSession tiers={tiers} />
      </Suspense>
    </div>
  );
}

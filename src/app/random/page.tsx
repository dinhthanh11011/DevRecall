import type { Metadata } from "next";
import { Suspense } from "react";
import { getQuestionIndex, getRoadmap } from "@/lib/content";
import { RandomPicker } from "./RandomPicker";

export const metadata: Metadata = { title: "Random question" };

export default function RandomPage() {
  const tiers = getRoadmap().map((tier) => ({
    id: tier.id,
    title: tier.title,
    tracks: tier.tracks.filter((t) => t.total > 0).map((t) => ({ slug: t.slug, title: t.title })),
  }));
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Random question</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Bốc ngẫu nhiên một câu theo topic, level, loại câu hỏi. Tự trả lời trước, mở gợi ý, rồi đọc{" "}
          <strong>Kiến thức liên quan</strong> (trích từ phần overview của track) để học lại đúng chỗ còn hổng. Phím tắt:{" "}
          <kbd>R</kbd> câu mới, <kbd>Space</kbd> mở đáp án, <kbd>0</kbd>–<kbd>4</kbd> tự chấm.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />}>
        <RandomPicker index={getQuestionIndex()} tiers={tiers} />
      </Suspense>
    </div>
  );
}

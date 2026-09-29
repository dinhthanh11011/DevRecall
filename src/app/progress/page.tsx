import type { Metadata } from "next";
import { getRoadmap } from "@/lib/content";
import { ProgressDashboard } from "./ProgressDashboard";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const tracks = getRoadmap().flatMap((tier) =>
    tier.tracks.map((t) => ({ slug: t.slug, title: t.title, tier: tier.title, total: t.total })),
  );
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your progress</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Lưu trong trình duyệt này (localStorage). Export file JSON để backup hoặc chuyển sang máy khác.
        </p>
      </header>
      <ProgressDashboard tracks={tracks} />
    </div>
  );
}

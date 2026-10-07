import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudyPlan, getStudyPlans } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { PlanProgress } from "../PlanProgress";
import { PlanDays } from "./PlanDays";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStudyPlans().map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/plans/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const plan = getStudyPlan(id);
  return { title: plan?.title ?? "Study plan", description: plan?.summary };
}

export default async function PlanPage(props: PageProps<"/plans/[id]">) {
  const { id } = await props.params;
  const plan = getStudyPlan(id);
  if (!plan) notFound();
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link href="/plans" className="text-sm text-slate-500 hover:underline">
          ← Lộ trình ôn tập
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{plan.title}</h1>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">{plan.summary}</p>
        <div className="max-w-md">
          <PlanProgress ids={plan.days.flatMap((d) => d.questionIds)} />
        </div>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <Markdown compact>{plan.intro}</Markdown>
      </section>
      <PlanDays days={plan.days} />
    </div>
  );
}

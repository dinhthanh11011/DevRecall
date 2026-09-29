import { getAllSlugs, getTrackData } from "@/lib/content";

// Per-track question JSON (+ overview sections and learn refs), generated at build time; used by Practice and Random.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function GET(_req: Request, ctx: RouteContext<"/data/[slug]">) {
  const { slug } = await ctx.params;
  const data = getTrackData(slug);
  if (!data) return new Response("Not found", { status: 404 });
  return Response.json(data);
}

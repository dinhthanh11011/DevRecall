import { getAllSlugs, getTrack } from "@/lib/content";

// Per-track question JSON, generated at build time; used by Practice mode.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function GET(_req: Request, ctx: RouteContext<"/data/[slug]">) {
  const { slug } = await ctx.params;
  const track = getTrack(slug);
  if (!track) return new Response("Not found", { status: 404 });
  return Response.json({ slug: track.slug, title: track.title, questions: track.questions });
}

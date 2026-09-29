import { getSearchIndex } from "@/lib/content";

// Search index (questions + lesson section headings/snippets), generated at build time and fetched by /search
// on demand, so the page itself stays light as lessons grow.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getSearchIndex());
}

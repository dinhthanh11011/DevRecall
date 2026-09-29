import type { Metadata } from "next";
import { getSearchIndex } from "@/lib/content";
import { SearchBox } from "./SearchBox";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  const index = getSearchIndex();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <SearchBox index={index} />
    </div>
  );
}

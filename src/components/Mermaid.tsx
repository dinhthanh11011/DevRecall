"use client";

import { useEffect, useId, useState } from "react";

export function Mermaid({ chart }: { chart: string }) {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "default" });
      try {
        const result = await mermaid.render(id, chart);
        if (!cancelled) setSvg(result.svg);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="not-prose my-4 rounded-lg border border-rose-300 p-3 text-sm dark:border-rose-800">
        <p className="mb-2 font-medium text-rose-600">Diagram failed to render</p>
        <pre className="overflow-x-auto text-xs">{chart}</pre>
      </div>
    );
  }
  if (!svg) return <div className="not-prose my-4 h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />;
  return (
    <div
      className="not-prose my-4 flex justify-center overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

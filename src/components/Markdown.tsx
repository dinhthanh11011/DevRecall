import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ReactNode } from "react";
import { Mermaid } from "./Mermaid";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

const components: Components = {
  code({ className, children, ...rest }) {
    if (className?.includes("language-mermaid")) return <Mermaid chart={textOf(children).trim()} />;
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    // Mermaid renders its own container; don't wrap it in <pre>.
    const child = Array.isArray(children) ? children[0] : children;
    if (
      child &&
      typeof child === "object" &&
      "props" in child &&
      String((child as { props: { className?: string } }).props.className ?? "").includes("language-mermaid")
    ) {
      return <>{children}</>;
    }
    return <pre>{children}</pre>;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    );
  },
  a({ href, children }) {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    );
  },
};

const inlineComponents: Components = { ...components, p: ({ children }) => <span>{children}</span> };

export function Markdown({
  children,
  compact = false,
  inline = false,
}: {
  children: string;
  compact?: boolean;
  /** Render paragraphs as <span> so the output is valid inside buttons/headings. */
  inline?: boolean;
}) {
  if (inline) {
    return (
      <span className="prose prose-zinc dark:prose-invert max-w-none prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
          {children}
        </ReactMarkdown>
      </span>
    );
  }
  return (
    <div className={`prose prose-zinc dark:prose-invert max-w-none ${compact ? "prose-sm" : ""} prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { plainText: ["mermaid"], detect: false }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

"use server";

import { MDXRemote } from "next-mdx-remote/rsc";
import { getMdxOptions } from "@shared/mdx-pipeline";
import Figure from "@/components/Figure";

const components = { Figure };

// A Server Action that returns JSX, not a JSON API returning an HTML
// string — deliberate. next-mdx-remote's actual MDX-to-JSX compiler (not
// just remark/rehype) is what resolves <Figure src=... /> the same way the
// published site does; stringifying to plain HTML would either drop custom
// components or render them wrong. Calling this from a client component and
// rendering what it returns is the supported RSC pattern for "server-render
// arbitrary content on demand".
export async function renderPreview(source: string) {
  try {
    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-inset prose-pre:border prose-pre:border-border">
        <MDXRemote source={source} components={components} options={{ mdxOptions: getMdxOptions() }} />
      </article>
    );
  } catch (err) {
    return (
      <div className="rounded-md border border-danger bg-bg-inset p-4 text-sm text-danger">
        Preview error: {(err as Error).message}
      </div>
    );
  }
}

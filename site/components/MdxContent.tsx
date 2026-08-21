import { MDXRemote } from "next-mdx-remote/rsc";
import { getMdxOptions } from "@shared/mdx-pipeline";
import Figure from "./Figure";

const components = { Figure };

export default function MdxContent({ source }: { source: string }) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-bg-inset prose-pre:border prose-pre:border-border">
      <MDXRemote source={source} components={components} options={{ mdxOptions: getMdxOptions() }} />
    </article>
  );
}

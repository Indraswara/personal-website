// Single source of truth for how MDX gets rendered — imported by both
// site/components/MdxContent.tsx (the real published pages) and admin's
// preview endpoint, so a writer's live preview is never a lie: whatever
// renders in the editor is exactly what ships. Don't diverge these; add a
// plugin here, not in either app individually.
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";

// One dark theme regardless of site light/dark mode — the terminal-lab
// palette is dark-first, and a light code theme would clash harder than
// staying dark in both modes.
export const prettyCodeOptions = { theme: "github-dark" as const };

export function getMdxOptions(): { remarkPlugins: PluggableList; rehypePlugins: PluggableList } {
  return {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex, [rehypePrettyCode, prettyCodeOptions]],
  };
}

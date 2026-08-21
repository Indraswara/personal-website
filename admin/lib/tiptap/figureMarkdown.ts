// The markdown-it side of round-tripping <Figure src="..." alt="..." caption="..." />
// (site/components/Figure.tsx's own prop shape) through the WYSIWYG editor.
//
// Why this can't just be "let html:true pass it through": a self-closing tag on an
// *unknown* element (`<Figure ... />`) is not valid HTML5 — only a fixed list of void
// elements (img, br, ...) honor the trailing slash. Verified empirically in a real
// Chromium: `<Figure src="x" /><p>after</p>` parses as `<figure src="x"><p>after</p></figure>`
// — the parser opens Figure and never closes it, silently swallowing every sibling
// after it as its child. tiptap-markdown's parser renders markdown to an HTML string
// and hands it to exactly this kind of real-browser DOMParser, so relying on the
// generic HTML passthrough here would corrupt any post with a Figure followed by more
// content. This rule intercepts the raw markdown line *before* any HTML parsing
// happens and emits unambiguous, real HTML (a normal <figure><img><figcaption>) instead.
import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block";

const FIGURE_LINE_RE = /^<Figure\s+([^>]*?)\s*\/?>(?:\s*<\/Figure>)?\s*$/i;
const ATTR_RE = /(\w+)=("([^"]*)"|'([^']*)')/g;

export function parseFigureAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(raw))) {
    attrs[m[1]] = m[3] ?? m[4] ?? "";
  }
  return attrs;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function figureBlockRule(md: MarkdownIt): void {
  md.block.ruler.before(
    "html_block",
    "figure_block",
    (state: StateBlock, startLine: number, _endLine: number, silent: boolean) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max);

      const match = FIGURE_LINE_RE.exec(line.trim());
      if (!match) return false;
      if (silent) return true;

      const attrs = parseFigureAttrs(match[1]);
      const token = state.push("figure_block", "", 0);
      token.map = [startLine, startLine + 1];
      token.attrSet("src", attrs.src ?? "");
      token.attrSet("alt", attrs.alt ?? "");
      token.attrSet("caption", attrs.caption ?? "");

      state.line = startLine + 1;
      return true;
    },
    { alt: [] },
  );

  md.renderer.rules.figure_block = (tokens, idx) => {
    const t = tokens[idx];
    const src = escapeHtml(t.attrGet("src") ?? "");
    const alt = escapeHtml(t.attrGet("alt") ?? "");
    const caption = escapeHtml(t.attrGet("caption") ?? "");
    // Real, well-understood HTML elements only — img is a void element (no
    // ambiguity), figure/figcaption always require and get explicit closes
    // from this renderer, so nothing here can swallow sibling content the
    // way the raw <Figure /> shorthand does.
    return `<figure data-type="figure-image"><img src="${src}" alt="${alt}"><figcaption>${caption}</figcaption></figure>\n`;
  };
}

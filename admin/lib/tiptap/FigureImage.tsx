"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { figureBlockRule, parseFigureAttrs } from "./figureMarkdown";

export interface FigureImageAttrs {
  src: string;
  alt: string;
  caption: string;
}

// Uploaded images serve from the site's own origin (site/public/posts/images,
// mounted read-only into `web` — see compose.yml), not admin's — a
// site-relative src would 404 previewing right here even though it resolves
// fine once actually published. Same resolution admin's old (now-removed)
// Figure preview component used.
function resolveImageSrc(src: string): string {
  if (!src || src.startsWith("http")) return src;
  return `https://egolab.top${src.startsWith("/") ? "" : "/"}${src}`;
}

function FigureImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, caption } = node.attrs as FigureImageAttrs;

  return (
    <NodeViewWrapper
      className={`my-4 ${selected ? "outline-2 outline-accent" : ""}`}
      data-drag-handle
    >
      <figure className="m-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- editor preview only; the actual site renders this via site/components/Figure.tsx */}
        <img src={resolveImageSrc(src)} alt={alt} className="w-full rounded-md border border-border" contentEditable={false} />
        <input
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Add a caption…"
          className="mt-2 w-full border-none bg-transparent text-center text-sm text-fg-subtle outline-none placeholder:text-fg-subtle/60"
        />
      </figure>
    </NodeViewWrapper>
  );
}

// Canonical on-disk shape for anything this editor writes is an explicit
// open+close tag, never self-closing — see figureMarkdown.ts for why. Old
// posts written with the self-closing form still load fine (figureBlockRule
// below handles both), they just get re-saved in the explicit form.
function serializeAttr(v: string): string {
  return v.replace(/"/g, "&quot;");
}

export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="figure-image"]',
        getAttrs: (el) => {
          if (typeof el === "string") return false;
          const img = el.querySelector("img");
          const figcaption = el.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") ?? "",
            alt: img?.getAttribute("alt") ?? "",
            caption: figcaption?.textContent ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, alt, caption } = node.attrs as FigureImageAttrs;
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-type": "figure-image" }),
      ["img", { src, alt }],
      ["figcaption", {}, caption],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureImageView);
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (s: string) => void; closeBlock: (n: unknown) => void }, node: { attrs: FigureImageAttrs }) {
          const { src, alt, caption } = node.attrs;
          state.write(
            `<Figure src="${serializeAttr(src)}" alt="${serializeAttr(alt)}" caption="${serializeAttr(caption)}"></Figure>`,
          );
          state.closeBlock(node);
        },
        parse: {
          setup(md: import("markdown-it")) {
            figureBlockRule(md);
          },
          updateDOM(element: HTMLElement) {
            // Belt-and-suspenders: figureBlockRule already turns both the
            // self-closing and explicit-close forms into a safe <figure
            // data-type="figure-image"> before this ever runs. This only
            // matters if some *other* path (e.g. pasted content) put a raw
            // <Figure> element directly into the DOM without going through
            // markdown-it at all.
            element.querySelectorAll("Figure, figure:not([data-type])").forEach((el) => {
              if (el.tagName.toLowerCase() !== "figure") {
                const attrs = parseFigureAttrs(el.getAttributeNames().map((n) => `${n}="${el.getAttribute(n)}"`).join(" "));
                const replacement = document.createElement("figure");
                replacement.setAttribute("data-type", "figure-image");
                const img = document.createElement("img");
                img.setAttribute("src", attrs.src ?? "");
                img.setAttribute("alt", attrs.alt ?? "");
                const figcaption = document.createElement("figcaption");
                figcaption.textContent = attrs.caption ?? "";
                replacement.append(img, figcaption);
                el.replaceWith(replacement);
              }
            });
          },
        },
      },
    };
  },
});

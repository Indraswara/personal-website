"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { FigureImage } from "@/lib/tiptap/FigureImage";
import { uploadImage } from "@/lib/actions";

interface Props {
  initialContent: string;
  onChange: (markdown: string) => void;
}

// tiptap-markdown doesn't ship a `declare module '@tiptap/core'` augmentation
// for editor.storage.markdown, so TS doesn't know it exists — this is the
// one place that reads it, casting narrowly rather than widening Storage
// globally.
function getMarkdown(storage: unknown): string {
  return (storage as { markdown: MarkdownStorage }).markdown.getMarkdown();
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus while clicking
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-md px-2.5 py-1.5 text-sm ${
        active ? "bg-accent text-accent-fg" : "text-fg-muted hover:bg-bg-inset hover:text-fg"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ initialContent, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
      FigureImage,
      Markdown.configure({ html: true, linkify: true, breaks: false }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none min-h-[60vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(getMarkdown(editor.storage));
    },
  });

  async function insertImage(file: File) {
    if (!editor) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await uploadImage(formData);
      if (!result.ok || !result.url) {
        alert(`Image upload failed: ${result.error}`);
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent({ type: "figureImage", attrs: { src: result.url, alt: "", caption: "" } })
        .run();
    } catch (err) {
      alert(`Image upload failed: ${(err as Error).message}`);
    }
  }

  if (!editor) {
    return <div className="min-h-[60vh] rounded-md border border-border bg-bg-elevated p-4 text-sm text-fg-subtle">Loading editor…</div>;
  }

  return (
    <div className="rounded-md border border-border bg-bg-elevated">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          H1
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"</>"}
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          —
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
          🖼
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = "";
          }}
        />
      </div>

      {editor && (
        <BubbleMenu editor={editor} className="flex gap-1 rounded-md border border-border bg-bg-elevated p-1 shadow-[var(--shadow)]">
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            {"</>"}
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor.isActive("link")}
            onClick={() => {
              const url = window.prompt("URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
              else editor.chain().focus().unsetLink().run();
            }}
          >
            🔗
          </ToolbarButton>
        </BubbleMenu>
      )}

      <div
        className="cursor-text px-6 py-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) editor.chain().focus("end").run();
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

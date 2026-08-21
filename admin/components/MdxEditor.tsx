"use client";

import { useState, useEffect, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import { renderPreview } from "@/lib/renderPreview";
import type { ActionResult } from "@/lib/actions";

// CodeMirror touches `window` at import time, same reason site/'s xterm.js
// is dynamically imported — see site/components/LiveTerminal.tsx.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

export type FieldSchema =
  | { key: string; label: string; type: "text" | "textarea" }
  | { key: string; label: string; type: "number" }
  | { key: string; label: string; type: "tags" };

interface Props {
  mode: "new" | "edit";
  slugLocked: boolean;
  initialSlug: string;
  initialFrontmatter: Record<string, unknown>;
  initialBody: string;
  fields: FieldSchema[];
  backHref: string;
  onSave: (slug: string, frontmatter: Record<string, unknown>, body: string) => Promise<ActionResult>;
  onDelete?: (slug: string) => Promise<ActionResult>;
}

function fieldToInputValue(v: unknown, type: FieldSchema["type"]): string {
  if (type === "tags") return Array.isArray(v) ? v.join(", ") : "";
  return v === undefined || v === null ? "" : String(v);
}

export default function MdxEditor({
  mode,
  slugLocked,
  initialSlug,
  initialFrontmatter,
  initialBody,
  fields,
  backHref,
  onSave,
  onDelete,
}: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.key] = fieldToInputValue(initialFrontmatter[f.key], f.type);
    return v;
  });
  const [body, setBody] = useState(initialBody);
  const [preview, setPreview] = useState<ReactNode>(null);
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Live preview, not a manual button — re-renders ~500ms after typing
  // stops. Debounced (not on every keystroke) because each render is a real
  // server round-trip (a Server Action running the actual MDX compiler, not
  // a client-side regex renderer — see lib/renderPreview.tsx for why that
  // matters for <Figure> and other MDX components).
  useEffect(() => {
    setIsPreviewing(true);
    const timer = setTimeout(() => {
      startTransition(async () => {
        setPreview(await renderPreview(body));
        setIsPreviewing(false);
      });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only body should retrigger this
  }, [body]);

  function buildFrontmatter(): Record<string, unknown> {
    const fm: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.key] ?? "";
      if (f.type === "tags") {
        fm[f.key] = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (f.type === "number") {
        if (raw.trim() !== "") fm[f.key] = Number(raw);
      } else if (raw.trim() !== "") {
        fm[f.key] = raw;
      }
    }
    return fm;
  }

  function doSave() {
    if (!slug.trim()) {
      setStatus("slug is required");
      return;
    }
    startTransition(async () => {
      setStatus("saving…");
      const result = await onSave(slug.trim(), buildFrontmatter(), body);
      if (result.ok) {
        setStatus("saved & pushed");
        router.push(backHref);
        router.refresh();
      } else {
        setStatus(`error: ${result.error}`);
      }
    });
  }

  function doDelete() {
    if (!onDelete) return;
    if (!confirm(`Delete "${slug}"? This pushes a commit removing it.`)) return;
    startTransition(async () => {
      setStatus("deleting…");
      const result = await onDelete(slug);
      if (result.ok) {
        router.push(backHref);
        router.refresh();
      } else {
        setStatus(`error: ${result.error}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-fg-muted">slug</span>
          <input
            value={slug}
            disabled={slugLocked}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-new-post"
            className="rounded-md border border-border bg-bg-inset px-2 py-1 font-mono text-fg disabled:opacity-60"
          />
        </label>
        <span className="text-xs text-fg-subtle">{status}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={2}
                className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
              />
            ) : (
              <input
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                type={f.type === "number" ? "number" : "text"}
                placeholder={f.type === "tags" ? "tag1, tag2, tag3" : undefined}
                className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
              />
            )}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border">
          <CodeMirror
            value={body}
            height="60vh"
            theme="dark"
            extensions={[markdown()]}
            onChange={(v: string) => setBody(v)}
          />
        </div>
        <div className="relative max-h-[60vh] overflow-y-auto rounded-md border border-border bg-bg-elevated p-4">
          {isPreviewing && (
            <span className="absolute top-2 right-3 text-xs text-fg-subtle">rendering…</span>
          )}
          {preview ?? <p className="text-sm text-fg-subtle">Preview renders automatically as you type.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={doSave}
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          {mode === "new" ? "Create & publish" : "Save & publish"}
        </button>
        {onDelete && mode === "edit" && (
          <button
            onClick={doDelete}
            disabled={isPending}
            className="ml-auto rounded-md border border-danger px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

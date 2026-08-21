"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "./RichEditor";
import type { ActionResult } from "@/lib/actions";

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
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const titleField = fields.find((f) => f.key === "title");
  const restFields = fields.filter((f) => f.key !== "title");

  // Slug auto-fills from the title while it's still untouched (new posts
  // only — never for an existing one, where the slug is the filename and
  // changing it out from under a save would orphan the old file).
  const [slugTouched, setSlugTouched] = useState(slugLocked || initialSlug !== "");
  function setTitle(title: string) {
    setValues((v) => ({ ...v, title }));
    if (!slugTouched) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60),
      );
    }
  }

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-fg-muted">slug</span>
          <input
            value={slug}
            disabled={slugLocked}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="my-new-post"
            className="rounded-md border border-border bg-bg-inset px-2 py-1 font-mono text-fg disabled:opacity-60"
          />
        </label>
        <span className="text-xs text-fg-subtle">{status}</span>
      </div>

      {titleField && (
        <input
          value={values.title ?? ""}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border-none bg-transparent text-4xl font-bold text-fg outline-none placeholder:text-fg-subtle/50"
        />
      )}

      <details className="rounded-md border border-border bg-bg-elevated open:pb-3">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold tracking-wide text-fg-muted uppercase select-none">
          Details {restFields.length ? `(${restFields.map((f) => f.label).join(", ")})` : ""}
        </summary>
        <div className="grid grid-cols-1 gap-3 px-3 sm:grid-cols-2">
          {restFields.map((f) => (
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
      </details>

      <RichEditor initialContent={initialBody} onChange={setBody} />

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

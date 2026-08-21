"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProject } from "@/lib/actions";

export default function NewProjectPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [repo, setRepo] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function setTitleAndSlug(v: string) {
    setTitle(v);
    if (!slugTouched) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  function submit() {
    if (!slug.trim() || !title.trim()) {
      setStatus("slug and title are required");
      return;
    }
    startTransition(async () => {
      setStatus("saving…");
      const result = await addProject({
        slug: slug.trim(),
        title: title.trim(),
        date: date.trim(),
        description: description.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        repo: repo.trim() || undefined,
      });
      if (result.ok) {
        router.push("/projects");
        router.refresh();
      } else {
        setStatus(`error: ${result.error}`);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold text-fg">Add project</h1>
      <p className="text-sm text-fg-muted">
        This adds a portfolio card only — title, date, description, tags, and an optional repo link. No
        subdomain, no playground command; a live demo needs a real deploy, done outside this app.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Title</span>
        <input
          value={title}
          onChange={(e) => setTitleAndSlug(e.target.value)}
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Slug</span>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 font-mono text-fg"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Date</span>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="2026"
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Tags (comma-separated)</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="TypeScript, React"
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Repo URL (optional)</span>
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/Indraswara/..."
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          Add project
        </button>
        <span className="text-xs text-fg-subtle">{status}</span>
      </div>
    </div>
  );
}

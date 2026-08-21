"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectMeta, removeProject } from "@/lib/actions";

interface RegistryEntry {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  repo?: string;
  web?: { subdomain: string };
  lab?: { cmd: string };
  site?: string;
}

function Row({ project }: { project: RegistryEntry }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [date, setDate] = useState(project.date);
  const [description, setDescription] = useState(project.description);
  const [tags, setTags] = useState(project.tags.join(", "));
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const wiring = [
    project.web ? `web: ${project.web.subdomain}.egolab.top` : null,
    project.lab ? `lab: ${project.lab.cmd}` : null,
    project.site ? `site: /${project.site}` : null,
  ].filter(Boolean);

  function save() {
    startTransition(async () => {
      setStatus("saving…");
      const result = await updateProjectMeta(project.slug, {
        title,
        date,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setStatus(result.ok ? "saved & pushed" : `error: ${result.error}`);
      if (result.ok) router.refresh();
    });
  }

  function del() {
    if (!confirm(`Remove "${project.title}" from the project list? This pushes a commit.`)) return;
    startTransition(async () => {
      const result = await removeProject(project.slug);
      if (result.ok) router.refresh();
      else setStatus(`error: ${result.error}`);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-fg-subtle">{project.slug}</span>
        <span className="text-xs text-fg-subtle">{wiring.join(" · ") || "no deploy wiring"}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">Date</span>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
          />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">Tags (comma-separated)</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
        />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          Save & publish
        </button>
        <button
          onClick={del}
          disabled={isPending}
          className="rounded-md border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
        >
          Remove
        </button>
        <span className="text-xs text-fg-subtle">{status}</span>
      </div>
    </div>
  );
}

export default function ProjectsClient({ projects }: { projects: RegistryEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {projects.map((p) => (
        <Row key={p.slug} project={p} />
      ))}
    </div>
  );
}

import Link from "next/link";
import { REGISTRY_PATH, readJson } from "@/lib/content";
import ProjectsClient from "./client";

export const dynamic = "force-dynamic"; // reads /repo, which only exists at runtime via the bind mount, not during docker build

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

export default function ProjectsPage() {
  const data = readJson<{ projects: RegistryEntry[] }>(REGISTRY_PATH);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">Projects</h1>
        <Link href="/projects/new" className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg">
          + Add project
        </Link>
      </div>
      <p className="mb-6 text-sm text-fg-muted">
        Title, date, description, and tags only. Deploy wiring (subdomain, playground command) isn&apos;t
        editable here — that needs a real deploy, not just a content edit. A project added here shows up
        as a portfolio card with no live demo, same as this repo&apos;s own hand-written entries.
      </p>
      <ProjectsClient projects={data.projects} />
    </div>
  );
}

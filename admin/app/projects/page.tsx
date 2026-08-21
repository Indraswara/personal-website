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
      <h1 className="mb-2 text-xl font-bold text-fg">Projects</h1>
      <p className="mb-6 text-sm text-fg-muted">
        Title, date, description, and tags only. Deploy wiring (subdomain, playground command) isn&apos;t
        editable here — that needs a real deploy, not just a content edit.
      </p>
      <ProjectsClient projects={data.projects} />
    </div>
  );
}

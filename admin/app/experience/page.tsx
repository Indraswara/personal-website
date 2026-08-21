import { SITE_DATA_PATH, readJson } from "@/lib/content";
import TimelineClient from "@/components/TimelineClient";

export const dynamic = "force-dynamic"; // reads /repo, which only exists at runtime via the bind mount, not during docker build

interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

export default function ExperiencePage() {
  const data = readJson<{ experience: TimelineItem[] }>(SITE_DATA_PATH);
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">Experience</h1>
      <TimelineClient section="experience" initialItems={data.experience} />
    </div>
  );
}

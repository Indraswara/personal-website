import { SITE_DATA_PATH, readJson } from "@/lib/content";
import TimelineClient from "@/components/TimelineClient";

export const dynamic = "force-dynamic"; // reads /repo, which only exists at runtime via the bind mount, not during docker build

interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

export default function EducationPage() {
  const data = readJson<{ education: TimelineItem[] }>(SITE_DATA_PATH);
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">Education</h1>
      <TimelineClient section="education" initialItems={data.education} />
    </div>
  );
}

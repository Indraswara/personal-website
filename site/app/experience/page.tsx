import type { Metadata } from "next";
import { getExperience } from "@/lib/siteData";
import TimelineSection from "@/components/TimelineSection";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Experience — Indraswara" };
export const revalidate = 60;

export default function ExperiencePage() {
  return (
    <PageContainer>
      <TimelineSection title="Experience" items={getExperience()} />
    </PageContainer>
  );
}

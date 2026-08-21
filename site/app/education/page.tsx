import type { Metadata } from "next";
import { getEducation } from "@/lib/siteData";
import TimelineSection from "@/components/TimelineSection";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Education — Indraswara" };
export const revalidate = 60;

export default function EducationPage() {
  return (
    <PageContainer>
      <TimelineSection title="Education" items={getEducation()} />
    </PageContainer>
  );
}

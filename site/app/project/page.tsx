import type { Metadata } from "next";
import { getAllProjects } from "@/lib/registry";
import ProjectList from "@/components/ProjectList";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Projects — Indraswara" };
export const revalidate = 60;

export default function ProjectPage() {
  return (
    <PageContainer>
      <ProjectList projects={getAllProjects()} />
    </PageContainer>
  );
}

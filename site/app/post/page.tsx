import type { Metadata } from "next";
import { getAllPostsMeta } from "@/lib/posts";
import PostListClient from "@/components/PostListClient";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Posts — Indraswara" };
export const revalidate = 60;

export default function PostListPage() {
  return (
    <PageContainer>
      <PostListClient posts={getAllPostsMeta()} />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import HtmlCheckerClient from "@/components/HtmlCheckerClient";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "HTML Checker — Indraswara" };

export default function HtmlCheckerPage() {
  return (
    <PageContainer>
    <section>
      <h1 className="mb-3 border-b-2 border-fg pb-2.5 text-xl font-bold">HTML Checker</h1>
      <p className="mb-5 max-w-[720px] leading-[1.7] text-fg-muted">
        Validates HTML syntax with a Pushdown Automaton derived from a context-free grammar. Paste some
        HTML below and run it through the real CLI tool, in the same hardened sandbox the playground uses.
      </p>
      <HtmlCheckerClient />
    </section>
    </PageContainer>
  );
}

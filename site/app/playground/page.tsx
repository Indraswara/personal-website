import type { Metadata } from "next";
import { getLabRegistry } from "@/lib/registry";
import TerminalChrome from "@/components/TerminalChrome";
import LiveTerminal from "@/components/LiveTerminal";
import { SSH_COMMAND } from "@/lib/content";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Playground — Indraswara" };

export default function PlaygroundPage() {
  const cliLabs = getLabRegistry().filter((p) => p.lab);

  return (
    <PageContainer>
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="mb-2 border-b-2 border-fg pb-2.5 text-xl font-bold">Playground</h1>
        <p className="text-sm text-fg-muted">
          An ephemeral, non-root, no-internet-egress Docker container — auto-killed after ~10 minutes or 3
          minutes idle, whichever comes first. Nothing you do here persists. Type <code className="rounded-sm bg-bg-inset px-1.5 py-0.5">labs</code> for
          this menu again, or <code className="rounded-sm bg-bg-inset px-1.5 py-0.5">exit</code> to leave.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <TerminalChrome title="guest@egolab — playground" bodyClassName="h-[calc(100vh-320px)] min-h-[420px]">
          <LiveTerminal />
        </TerminalChrome>

        <aside className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs tracking-[2px] text-fg-subtle uppercase">Project demos</p>
            <ul className="flex flex-col gap-3">
              {cliLabs.map((p) => (
                <li key={p.slug} className="text-sm">
                  <code className="rounded-sm bg-bg-inset px-1.5 py-0.5 text-fg">{p.lab!.cmd}</code>
                  <p className="mt-1 text-xs text-fg-muted">{p.lab!.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs tracking-[2px] text-fg-subtle uppercase">Getting around</p>
            <ul className="flex flex-col gap-1.5 text-xs text-fg-muted">
              <li>
                <code className="rounded-sm bg-bg-inset px-1.5 py-0.5">ls /srv/projects</code> — browse
                every project&apos;s read-only source
              </li>
              <li>
                <code className="rounded-sm bg-bg-inset px-1.5 py-0.5">cat ~/README</code> — quick
                reference
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs tracking-[2px] text-fg-subtle uppercase">Prefer real SSH?</p>
            <code className="block rounded-sm bg-bg-inset p-2 text-[11px] break-all text-fg-muted">
              {SSH_COMMAND}
            </code>
          </div>
        </aside>
      </div>
    </div>
    </PageContainer>
  );
}

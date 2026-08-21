import { HOME_INTRO, CV_PATH } from "@/lib/content";
import ContactLinks from "@/components/ContactLinks";
import TerminalChrome from "@/components/TerminalChrome";
import LiveTerminal from "@/components/LiveTerminal";
import PageContainer from "@/components/PageContainer";

export default function HomePage() {
  return (
    <PageContainer>
    <div className="grid min-h-[300px] grid-cols-1 items-center gap-12 py-8 md:grid-cols-[0.85fr_1.15fr]">
      <div>
        <div className="max-w-[600px] text-lg leading-[1.8] text-fg-muted">
          {HOME_INTRO.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={CV_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-fg px-4 py-2 text-[13px] text-bg transition-opacity hover:opacity-80"
          >
            Download CV
          </a>
          <a
            href="/playground"
            className="rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
          >
            Enter playground →
          </a>
        </div>
        <ContactLinks />
      </div>

      <TerminalChrome title="guest@egolab" bodyClassName="h-[460px]">
        <LiveTerminal />
      </TerminalChrome>
    </div>
    </PageContainer>
  );
}

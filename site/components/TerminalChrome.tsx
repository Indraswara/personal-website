import type { ReactNode } from "react";

// The padding/background lives on this wrapper, NOT on the element xterm.js
// itself mounts into (that's `bodyClassName` — LiveTerminal/OutputTerminal's
// own div stays h-full/w-full with zero padding). xterm measures its mount
// element's clientHeight/clientWidth to compute rows/cols and the scrollable
// viewport; padding on that exact element shrinks the usable area xterm
// thinks it has, clipping the bottom row and capping how far scroll can go.
export default function TerminalChrome({
  title,
  bodyClassName,
  children,
}: {
  title: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border shadow-[var(--shadow)]">
      <div className="flex items-center gap-3 bg-[#161b22] px-3 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-xs text-[#8b949e]">{title}</span>
      </div>
      <div className={`bg-[#0d1117] p-3 ${bodyClassName ?? ""}`}>{children}</div>
    </div>
  );
}

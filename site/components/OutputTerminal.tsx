"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Terminal } from "@xterm/xterm";

export interface OutputTerminalHandle {
  write: (text: string) => void;
  reset: () => void;
}

// Read-only xterm instance for one-shot command output (the HTML checker).
// No FitAddon, no WebSocket, no resize handling — it never needs to react to
// anything but the imperative write()/reset() calls from its parent. Stays
// padding-free (see LiveTerminal's comment) — put padding/background on
// TerminalChrome's bodyClassName instead.
const OutputTerminal = forwardRef<OutputTerminalHandle, { className?: string }>(function OutputTerminal(
  { className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      if (disposed || !containerRef.current) return;
      const t = new Terminal({
        convertEol: true,
        disableStdin: true,
        fontFamily: 'var(--font-mono-lab), ui-monospace, "SFMono-Regular", monospace',
        fontSize: 13,
        theme: { background: "#0d1117", foreground: "#c9d1d9" },
      });
      t.open(containerRef.current);
      t.write("paste some HTML and hit Check\r\n");
      termRef.current = t;
    })();
    return () => {
      disposed = true;
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    write: (text: string) => termRef.current?.write(text),
    reset: () => termRef.current?.reset(),
  }));

  return <div ref={containerRef} className={`h-full w-full ${className ?? ""}`} />;
});

export default OutputTerminal;

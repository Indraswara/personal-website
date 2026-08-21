"use client";

import { useEffect, useRef } from "react";
import type { Terminal } from "@xterm/xterm";

// xterm touches `window` at import time, so it's dynamically imported inside
// this effect (client-only, never runs during SSR) rather than statically at
// module scope — cheaper than wrapping the whole component in
// next/dynamic({ ssr: false }) and equally safe.
//
// This div must stay padding-free and h-full/w-full of its parent — xterm
// measures ITS OWN mount element's box to compute rows/cols; any padding
// here shrinks the area it thinks it has without shrinking what it actually
// renders, clipping the bottom row. Put padding/background on the wrapper
// (TerminalChrome's bodyClassName) instead.
export default function LiveTerminal({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let term: Terminal | null = null;
    let ws: WebSocket | null = null;
    let observer: ResizeObserver | null = null;
    let rafId = 0;

    (async () => {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (disposed || !containerRef.current) return;

      const t = new Terminal({
        convertEol: true,
        fontFamily: 'var(--font-mono-lab), ui-monospace, "SFMono-Regular", monospace',
        fontSize: 13,
        theme: { background: "#0d1117", foreground: "#c9d1d9", cursor: "#3fb950" },
      });
      const fit = new FitAddon();
      t.loadAddon(fit);
      t.open(containerRef.current);
      // Fit BEFORE connecting so the size rides along in the WS query string
      // — the server's first frame renders at the right size instead of a
      // fallback that gets resized (and re-rendered) moments later.
      fit.fit();
      term = t;

      const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const base = isLocal ? `ws://${location.hostname}:8091/ws` : "wss://term.egolab.top/ws";
      let socket: WebSocket;
      try {
        socket = new WebSocket(`${base}?cols=${t.cols}&rows=${t.rows}`);
      } catch {
        t.write("\r\nlab terminal unavailable\r\n");
        return;
      }
      socket.binaryType = "arraybuffer";
      ws = socket;

      socket.onmessage = (event) => {
        const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
        t.write(data);
      };
      socket.onclose = () => {
        t.write("\r\n\r\n[connection closed]\r\n");
      };
      socket.onerror = () => {
        t.write("\r\nlab terminal unavailable — try again shortly\r\n");
      };

      // Keystrokes ride as raw strings, resize as JSON — the server treats
      // anything that parses as {"type":"resize",...} specially and writes
      // everything else verbatim to the shell's stdin. Don't wrap both the
      // same way.
      t.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(data);
      });

      const refit = () => {
        const prevCols = t.cols;
        const prevRows = t.rows;
        fit.fit();
        if (t.cols !== prevCols || t.rows !== prevRows) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "resize", cols: t.cols, rows: t.rows }));
          }
          t.clear(); // avoid a stray leftover line from the pre-resize frame
        }
        // Force a full repaint regardless of whether cols/rows changed —
        // ResizeObserver can fire several times in one layout pass while the
        // page is still settling right after mount (grid reflow, web font
        // swap), and without this the canvas can end up showing a stale
        // strip from an earlier paint even though the logical text buffer
        // (.xterm-rows) is already correct — confirmed by comparing the two
        // directly with a headless-browser screenshot vs. the DOM text.
        t.refresh(0, t.rows - 1);
      };

      // ResizeObserver on the actual container catches every box-size change
      // that matters — CSS grid/flex reflow settling after mount, a web font
      // swapping in and changing cell metrics, a sidebar toggling — not just
      // window-level resizes, which a plain `window.addEventListener("resize")`
      // would miss entirely on a layout like /playground's grid. Coalesced
      // into one fit() per animation frame — reacting synchronously to every
      // single observer callback during the volatile initial-mount layout
      // pass is exactly what was racing the canvas repaint above.
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(refit);
      });
      observer.observe(containerRef.current);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      if (ws) {
        ws.onclose = null; // don't print "[connection closed]" into a terminal being torn down
        ws.close();
      }
      if (term) term.dispose();
    };
  }, []);

  return <div ref={containerRef} className={`h-full w-full ${className ?? ""}`} />;
}

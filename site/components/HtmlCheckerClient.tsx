"use client";

import { useRef, useState } from "react";
import OutputTerminal, { type OutputTerminalHandle } from "./OutputTerminal";
import TerminalChrome from "./TerminalChrome";

const SAMPLE_VALID = `<html>\n  <head><title>Sample</title></head>\n  <body><p>Hello, world!</p></body>\n</html>`;
const SAMPLE_INVALID = `<html>\n  <head><body><p>Missing closing tags`;

function apiURL() {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  return isLocal ? `http://${location.hostname}:8091/api/htmlcheck` : "https://term.egolab.top/api/htmlcheck";
}

export default function HtmlCheckerClient() {
  const [value, setValue] = useState(SAMPLE_VALID);
  const [running, setRunning] = useState(false);
  const termRef = useRef<OutputTerminalHandle>(null);

  async function run() {
    const html = value.trim();
    if (!html) return;
    setRunning(true);
    try {
      const res = await fetch(apiURL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      const data = await res.json();
      termRef.current?.reset();
      if (data.error) {
        termRef.current?.write(`error: ${data.error}\r\n`);
      } else {
        termRef.current?.write(String(data.output).replace(/\n/g, "\r\n"));
      }
    } catch {
      termRef.current?.reset();
      termRef.current?.write("error: could not reach the checker — try again shortly\r\n");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        placeholder="<html>...</html>"
        className="min-h-[180px] w-full rounded-md border border-border bg-bg-elevated p-3 font-mono text-[13px] text-fg"
      />
      <div className="my-3.5 flex flex-wrap gap-2.5">
        <button
          onClick={run}
          disabled={running}
          className="rounded-sm bg-fg px-4 py-2 text-[13px] text-bg transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {running ? "Checking…" : "Check"}
        </button>
        <button
          type="button"
          onClick={() => setValue(SAMPLE_VALID)}
          className="rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
        >
          Valid sample
        </button>
        <button
          type="button"
          onClick={() => setValue(SAMPLE_INVALID)}
          className="rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
        >
          Invalid sample
        </button>
      </div>
      <TerminalChrome title="htmlcheck" bodyClassName="h-[420px]">
        <OutputTerminal ref={termRef} />
      </TerminalChrome>
    </>
  );
}

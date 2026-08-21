"use client";

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="theme-toggle-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-bg-inset"
    >
      <span className="block h-3 w-3 rounded-full border-2 border-fg [html[data-theme=dark]_&]:bg-fg [html[data-theme=dark]_&]:shadow-[inset_-4px_-2px_0_0_var(--bg-elevated)]" />
    </button>
  );
}

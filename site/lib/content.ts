// Static site copy — ported 1:1 from the old content/*.js globals.
// Live project data (with subdomains/lab commands) comes from lib/registry.ts.
// Experience/education moved to content/site-data.json (lib/siteData.ts) so
// admin.egolab.top can edit them at runtime — see that file, not here.
import type { ContactLink } from "./types";

export const HOME_INTRO: string[] = [
  "Hello, you just came to my personal website. My name is Indraswara, you can call me Indra.",
];

// Known-broken URLs (LinkedIn host is malformed) — left as-is per explicit
// user instruction earlier in the project; don't "fix" without asking again.
export const CONTACT_LINKS: ContactLink[] = [
  { id: "github", label: "GitHub", url: "https://github.com/indraswara", iconPath: "/icons/github.svg" },
  { id: "linkedin", label: "LinkedIn", url: "https://short.me.indraswara/linkeidn", iconPath: "/icons/linkedin.svg" },
  { id: "codeforces", label: "Codeforces", url: "https://codeforces.com/profile/AnotherA", iconPath: "/icons/codeforces.svg" },
  { id: "leetcode", label: "LeetCode", url: "https://leetcode.com/u/KiiroMahiro/", iconPath: "/icons/leetcode.svg" },
];

export const CV_PATH = "/cv/Indraswara-CV.pdf";
export const SSH_COMMAND =
  'ssh -o ProxyCommand="cloudflared access tcp --hostname ssh.egolab.top" guest@ssh.egolab.top';

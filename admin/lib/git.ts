// Commits land against the repo's real working tree (bind-mounted `.:/repo`
// rw in compose.yml, not a Docker volume) — that's the whole point: git
// history stays natural, and every other consumer of content/registry.json
// etc. reads the same files admin just wrote, with zero extra plumbing.
//
// `git add` is always scoped to the exact files a save touched, never `-A`.
// This working tree is the same one active development happens in — a
// broad add would risk sweeping up unrelated in-progress changes sitting in
// the tree at push time.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const REPO_DIR = "/repo";

async function git(args: string[], extraEnv?: Record<string, string>) {
  return run(
    "git",
    // Git refuses to operate on a repo it doesn't consider "safely" owned
    // when the working tree's UID doesn't match the running process's —
    // true here by construction, since /repo is a bind mount owned by the
    // host user while this container runs as a different UID. `-c` scopes
    // the exception to this one invocation rather than writing it into a
    // persisted, container-wide ~/.gitconfig.
    ["-c", `safe.directory=${REPO_DIR}`, ...args],
    {
      cwd: REPO_DIR,
      env: { ...process.env, ...extraEnv },
      maxBuffer: 10 * 1024 * 1024,
    },
  );
}

export interface CommitResult {
  committed: boolean;
}

export async function commitAndPush(files: string[], message: string): Promise<CommitResult> {
  if (files.length === 0) throw new Error("commitAndPush: no files given");

  await git(["add", "--", ...files]);

  const { stdout: status } = await git(["status", "--porcelain", "--", ...files]);
  if (!status.trim()) {
    // Nothing actually changed (e.g. saved without edits) — not an error.
    return { committed: false };
  }

  const authorEnv = {
    GIT_AUTHOR_NAME: process.env.GIT_USER_NAME ?? "egolab-admin",
    GIT_AUTHOR_EMAIL: process.env.GIT_USER_EMAIL ?? "admin@egolab.top",
    GIT_COMMITTER_NAME: process.env.GIT_USER_NAME ?? "egolab-admin",
    GIT_COMMITTER_EMAIL: process.env.GIT_USER_EMAIL ?? "admin@egolab.top",
  };
  await git(["commit", "-m", message], authorEnv);

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set — committed locally but cannot push");
  const remote = process.env.GIT_REMOTE_URL ?? "https://github.com/Indraswara/personal-website.git";
  // Credential rides on the push argv, not a persisted rewrite of the
  // mounted .git/config's origin URL — this repo's origin stays exactly
  // what a human working in it would expect to see.
  const authedRemote = remote.replace("https://", `https://x-access-token:${token}@`);
  await git(["push", authedRemote, "HEAD:main"]);

  return { committed: true };
}

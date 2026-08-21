#!/usr/bin/env bash
# Clones (or updates) every project repo declared in content/registry.json into
# projects/<slug>/ (gitignored). Used locally and on the VPS during deploy, so
# it must be idempotent and safe to re-run.
set -euo pipefail

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/registry.sh"

PROJECTS_DIR="$REGISTRY_ROOT/projects"
mkdir -p "$PROJECTS_DIR"

failures=()

while IFS=$'\t' read -r slug url; do
  [ -n "$slug" ] || continue
  dest="$PROJECTS_DIR/$slug"

  if [ -d "$dest/.git" ]; then
    echo "==> [$slug] already cloned, pulling latest"
    if ! git -C "$dest" pull --ff-only; then
      echo "!!  [$slug] pull failed (local changes or diverged) — leaving as-is"
    fi
  else
    echo "==> [$slug] cloning $url"
    if ! git clone --depth 1 "$url" "$dest"; then
      echo "!!  [$slug] clone FAILED"
      failures+=("$slug")
      continue
    fi
  fi
done < <(registry_repos)

echo
if [ "${#failures[@]}" -eq 0 ]; then
  echo "All repos cloned/updated into $PROJECTS_DIR"
else
  echo "Done with failures: ${failures[*]}"
  exit 1
fi

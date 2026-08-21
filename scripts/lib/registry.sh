#!/usr/bin/env bash
# Shared helpers for reading content/registry.json (the single source of truth)
# from shell scripts. Source this file: `. scripts/lib/registry.sh`
set -euo pipefail

REGISTRY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY_JSON="$REGISTRY_ROOT/content/registry.json"

_registry_require_jq() {
  command -v jq >/dev/null 2>&1 || { echo "jq is required but not installed" >&2; exit 1; }
}

# All projects that declare a `repo`, as "slug<TAB>repo" lines.
registry_repos() {
  _registry_require_jq
  jq -r '.projects[] | select(.repo != null) | "\(.slug)\t\(.repo)"' "$REGISTRY_JSON"
}

# All projects with a `web` block, as "slug<TAB>subdomain<TAB>port" lines.
registry_web() {
  _registry_require_jq
  jq -r '.projects[] | select(.web != null) | "\(.slug)\t\(.web.subdomain)\t\(.web.port)"' "$REGISTRY_JSON"
}

# All subdomains (web projects + the fixed core hostnames) — for cloudflared ingress.
registry_subdomains() {
  _registry_require_jq
  jq -r '.projects[] | select(.web != null) | .web.subdomain' "$REGISTRY_JSON"
}

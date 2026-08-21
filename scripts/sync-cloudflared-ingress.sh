#!/usr/bin/env bash
# Regenerates /etc/cloudflared/config.yml's egolab.top ingress rules from
# content/registry.json, preserving any other hostnames already in the file
# (e.g. app.egolab.top, streak.egolab.top — unrelated homelab services this
# repo doesn't own). Prints a diff and asks for confirmation before writing
# and reloading cloudflared; never applies silently.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/content/registry.json"
CONFIG=/etc/cloudflared/config.yml

if [ ! -f "$CONFIG" ]; then
  echo "sync-cloudflared-ingress: $CONFIG not found, skipping" >&2
  exit 0
fi
if ! command -v jq >/dev/null; then
  echo "sync-cloudflared-ingress: jq is required" >&2
  exit 1
fi

TMP="$(mktemp)"
OWNED="$(mktemp)"
trap 'rm -f "$TMP" "$OWNED"' EXIT

# The exact set of hostnames this script owns — the 3 fixed ones plus every
# web subdomain from the registry. Used below to recognize (and skip) our
# own entries from a previous run when passing through everything else, so
# the match can't accidentally swallow an unrelated *.egolab.top hostname
# (e.g. app.egolab.top) that merely shares the same parent domain.
{
  echo "egolab.top"
  echo "term.egolab.top"
  echo "ssh.egolab.top"
  jq -r '.projects[] | select(.web) | "\(.web.subdomain).egolab.top"' "$REGISTRY"
} > "$OWNED"

# Preamble (tunnel id + credentials-file) is copied verbatim from the current
# config — this script only ever owns the `ingress:` list.
awk '/^ingress:/{exit} {print}' "$CONFIG" > "$TMP"

{
  echo "ingress:"
  echo "  - hostname: egolab.top"
  echo "    service: http://127.0.0.1:8090"
  echo
  echo "  - hostname: term.egolab.top"
  echo "    service: http://127.0.0.1:8091"
  echo
  echo "  - hostname: ssh.egolab.top"
  echo "    service: tcp://127.0.0.1:2022"
  echo

  jq -r '.projects[] | select(.web) | "\(.web.subdomain) \(.web.port)"' "$REGISTRY" |
    while read -r sub port; do
      echo "  - hostname: ${sub}.egolab.top"
      echo "    service: http://127.0.0.1:${port}"
      echo
    done

  # Everything this repo doesn't own (app.egolab.top, streak.egolab.top, …):
  # copy through as-is, skipping our own hostnames from a previous run (see
  # $OWNED above) and the trailing catch-all (re-added below).
  awk -v owned="$OWNED" '
    BEGIN { while ((getline h < owned) > 0) own[h] = 1 }
    /^ingress:/ { f=1; next }
    !f { next }
    /^  - hostname: / {
      h = $0; sub(/^  - hostname: /, "", h)
      skip = (h in own)
    }
    /^  - service: http_status:404$/ { next }
    !skip
  ' "$CONFIG"

  echo "  - service: http_status:404"
} >> "$TMP"

echo "--- proposed diff for $CONFIG ---"
diff -u "$CONFIG" "$TMP" || true
echo "---"

read -r -p "Apply this config and reload cloudflared? [y/N] " ans
if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
  echo "sync-cloudflared-ingress: aborted, no changes made"
  exit 0
fi

sudo cp "$TMP" "$CONFIG"
sudo systemctl restart cloudflared
echo "sync-cloudflared-ingress: applied and restarted"

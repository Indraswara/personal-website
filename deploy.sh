#!/usr/bin/env bash
# Manual deploy — run this ON THE VPS, in the checkout directory, after a
# `git push` from your machine. There is no CI; this script is the whole
# pipeline.
#
# Usage: ./deploy.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Syncing project repos (labs + subdomains)"
./scripts/clone-projects.sh

echo "==> Building sandbox playground image"
docker build -t egolab-sandbox:latest -f sandbox/Dockerfile .

echo "==> Building and starting core services (web, terminal)"
docker compose -f compose.yml up -d --build

if [ -x ./scripts/sync-cloudflared-ingress.sh ]; then
  echo "==> Syncing cloudflared ingress"
  ./scripts/sync-cloudflared-ingress.sh
fi

echo "==> Pruning dangling images"
docker image prune -f

echo
echo "Deploy complete:"
docker compose -f compose.yml ps

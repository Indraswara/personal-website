# admin/ — admin.egolab.top CMS. Build context MUST be the repo root (same
# convention as site/Dockerfile, which this mirrors):
#   docker build -t egolab-admin:latest -f admin/Dockerfile .
#
# Runtime needs `git` (lib/git.ts shells out to it against the bind-mounted
# /repo — see compose.yml's admin service) — the one meaningful difference
# from site/Dockerfile's runtime stage, which never writes anything.
FROM node:20-bookworm AS deps
WORKDIR /build
COPY admin/package.json admin/package-lock.json ./admin/
RUN cd admin && npm ci
COPY shared/package.json shared/package-lock.json ./shared/
RUN cd shared && npm ci

FROM node:20-bookworm AS build
WORKDIR /build
COPY --from=deps /build/admin/node_modules ./admin/node_modules
COPY --from=deps /build/shared/node_modules ./shared/node_modules
COPY admin/ ./admin/
COPY shared/ ./shared/
RUN cd admin && npm run build

FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /build/admin/.next/standalone/admin ./admin
COPY --from=build /build/admin/.next/standalone/shared ./shared
COPY --from=build /build/admin/.next/static ./admin/.next/static
COPY --from=build /build/admin/public ./admin/public
WORKDIR /app/admin
EXPOSE 3000
# Matches the host user's UID (1000) — node:20-bookworm-slim's built-in
# "node" user happens to be exactly that. Without this, every git object
# this container's git commands write to the bind-mounted /repo lands
# owned by root, and the host user loses write access to their own repo
# the next time they run git directly (a real incident: "insufficient
# permission for adding an object to repository database").
USER node
CMD ["node", "server.js"]

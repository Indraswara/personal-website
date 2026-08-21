# site/ — egolab.top main portfolio, Next.js (App Router) built to
# `output: standalone`. Build context MUST be the repo root (same convention
# as every labs/*/Dockerfile):
#   docker build -t egolab-web:latest -f site/Dockerfile .
#
# Layout mirrors local dev on purpose: site/ imports shared/mdx-pipeline.ts
# (repo root, also used by admin/) via turbopack.root pointing one level up
# (site/next.config.ts) — Next's own output tracer follows that and nests
# the standalone build the same way (.next/standalone/{site,shared}/...),
# so every stage below keeps site/ and shared/ as siblings rather than
# flattening into a single WORKDIR like this file did before shared/ existed.
FROM node:20-bookworm AS deps
WORKDIR /build
COPY site/package.json site/package-lock.json ./site/
RUN cd site && npm ci
COPY shared/package.json shared/package-lock.json ./shared/
RUN cd shared && npm ci

FROM node:20-bookworm AS build
WORKDIR /build
COPY --from=deps /build/site/node_modules ./site/node_modules
COPY --from=deps /build/shared/node_modules ./shared/node_modules
COPY site/ ./site/
COPY shared/ ./shared/
# site/content/{registry,homelab,site-data}.json are symlinks to the
# repo-root canonical files, used for local dev convenience — Turbopack
# doesn't follow them for bundling, and Docker can't copy a symlink pointing
# outside the build context anyway, so they're overwritten here with the
# real files. Must come AFTER `COPY site/ ./site/`.
COPY content/registry.json  ./site/content/registry.json
COPY content/homelab.json   ./site/content/homelab.json
COPY content/site-data.json ./site/content/site-data.json
RUN cd site && npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /build/site/.next/standalone/site ./site
COPY --from=build /build/site/.next/standalone/shared ./shared
COPY --from=build /build/site/.next/static ./site/.next/static
COPY --from=build /build/site/public ./site/public
# Not traced into .next/standalone/site/content by Next's build tracer (only
# the MDX content actually read via generateStaticParams gets swept in) —
# copied explicitly so a runtime re-read of the registry (e.g. under ISR)
# doesn't depend on anything outside this image.
COPY content/registry.json  ./site/content/registry.json
COPY content/homelab.json   ./site/content/homelab.json
COPY content/site-data.json ./site/content/site-data.json
WORKDIR /app/site
EXPOSE 3000
CMD ["node", "server.js"]

# riilcert ("riilcert.egolab.top") — Next.js app-router app: server-rendered
# pages plus its own /api routes (app/api/upload, app/api/history) for
# certificate file storage + issuance history. Everything else (wallet
# connect, signing, contract calls) happens client-side straight against the
# already-deployed Sepolia contract via plain ethers.js + window.ethereum —
# no RainbowKit/wagmi wiring in the actual code despite being in
# package.json, so no WalletConnect Project ID is needed.
#
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, same
# as Vite's import.meta.env — they must be passed as build args, not just
# container env.
#
# Build context MUST be the repo root:
#   docker build -t egolab-riilcert:latest -f labs/riilcert/Dockerfile \
#     --build-arg NEXT_PUBLIC_ETH_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com .
FROM node:20-bookworm AS build
WORKDIR /app
COPY projects/riilcert/frontend/package.json projects/riilcert/frontend/package-lock.json* ./
RUN npm ci
COPY projects/riilcert/frontend/ ./
# Fix on top of the upstream checkout — see labs/riilcert/overrides
# (app/verify/page.tsx imports the undeclared `qrcode/lib/server` deep path;
# `next build`'s type check fails on it even though `next dev` never runs
# full type-checking, which is why upstream's own dev workflow never caught
# it — see the comment in the override file for the story).
COPY labs/riilcert/overrides/frontend/ ./

ARG NEXT_PUBLIC_CONTRACT_ADDRESS=0xc694a2DF2B4FD2115245bB5f56aD97E841F724b4
ARG NEXT_PUBLIC_CHAIN_ID=11155111
ARG NEXT_PUBLIC_ETH_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=${NEXT_PUBLIC_CONTRACT_ADDRESS}
ENV NEXT_PUBLIC_CHAIN_ID=${NEXT_PUBLIC_CHAIN_ID}
ENV NEXT_PUBLIC_ETH_RPC_URL=${NEXT_PUBLIC_ETH_RPC_URL}
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js
# app/api/upload writes into public/certificates, app/api/history writes
# certificate_history.json into ./tmp — both mounted as named volumes in
# compose.yml so uploads/history survive a redeploy.
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

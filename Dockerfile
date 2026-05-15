# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

ENV CI=true

COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm ci

FROM deps AS builder
WORKDIR /app

COPY . .

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_DIST_DIR=/app/apps/web/dist

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

EXPOSE 3000

CMD ["node", "apps/server/dist/index.mjs"]

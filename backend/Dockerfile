FROM node:22-alpine AS builder
WORKDIR /app
# Use the npm lockfile (package-lock.json) — it is the in-sync source of truth for
# this backend's dependencies. (The committed pnpm-lock.yaml is intentionally not used.)
COPY package*.json ./
RUN npm ci
COPY . .
# The Prisma client is committed under src/generated/prisma and compiled by nest build.
# Driver-adapter mode (@prisma/adapter-pg) means no native query-engine binary is needed.
RUN npm run build \
    && test -f dist/main.js \
    || (echo 'ERROR: dist/main.js missing after build — check tsconfig.build.json rootDir: src' && exit 1)

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# prisma/ holds schema.prisma + migrations + seed.js; the deploy re-runs
# `prisma migrate deploy` and `prisma db seed` at boot (both idempotent).
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]

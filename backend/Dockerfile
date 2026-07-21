# syntax=docker/dockerfile:1

# ---- deps: install ALL dependencies (dev deps needed to compile TypeScript) ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# `npm ci` triggers the postinstall `prisma generate`, which only reads the schema (it doesn't
# connect to a database) — this placeholder just satisfies prisma.config.ts's env lookup. The
# real DATABASE_URL is injected by the hosting platform at runtime, never baked into the image.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npm ci

# ---- build: compile TypeScript to dist/ ----
FROM deps AS build
WORKDIR /app
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: install production-only dependencies ----
FROM node:20-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npm ci --omit=dev

# ---- runtime: minimal final image ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 expressjs
COPY --from=prod-deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=expressjs:nodejs /app/dist ./dist
COPY --chown=expressjs:nodejs package.json ./
COPY --chown=expressjs:nodejs prisma ./prisma
USER expressjs
EXPOSE 6006
# Applies any pending migrations (safe no-op if already up to date) before starting the server —
# `migrate deploy` just runs pending migration.sql files in order, no shadow database required.
CMD ["npm", "run", "start:deploy"]

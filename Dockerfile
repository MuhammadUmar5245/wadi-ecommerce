# Wadi Al Ghubaitah — production image (Next.js 14 + Prisma/SQLite)
#
#   docker build -t wadi-ecommerce .
#   docker run -p 3000:3000 -v wadi-data:/data -e AUTH_SECRET="$(openssl rand -base64 32)" wadi-ecommerce
#
# The SQLite database lives on the /data volume. On first start the container
# applies migrations and loads the demo data; later starts keep existing data.

FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies ───────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── Build ──────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A throwaway database is enough for the build (pages are rendered on request).
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate && npm run build && npm prune --omit=dev --ignore-scripts \
  && npm install --no-save --ignore-scripts prisma@5.22.0 tsx@4.19.2

# ── Runtime ────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL="file:/data/wadi.db" \
    AUTH_TRUST_HOST=true \
    DEMO_MODE=true
RUN groupadd --system app && useradd --system --gid app --home /app app && mkdir -p /data && chown app:app /data
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/messages ./messages
COPY --from=build --chown=app:app /app/src/lib ./src/lib
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/package.json /app/next.config.mjs ./
USER app
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD node -e "fetch('http://127.0.0.1:3000/en').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "scripts/docker-start.sh"]

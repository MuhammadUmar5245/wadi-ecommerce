#!/bin/sh
# Container entrypoint: migrate, seed the demo data once, then start Next.js.
set -e

# Trust the Host header (the container usually sits behind a proxy or port mapping).
export AUTH_TRUST_HOST="${AUTH_TRUST_HOST:-true}"

if [ -z "$AUTH_SECRET" ]; then
  echo "AUTH_SECRET is not set. Pass one with -e AUTH_SECRET=... (e.g. openssl rand -base64 32)." >&2
  exit 1
fi

npx prisma migrate deploy

USERS=$(node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log(c);return p.\$disconnect()}).catch(()=>console.log(0))")
if [ "$USERS" = "0" ]; then
  echo "Empty database — loading demo data…"
  npx tsx prisma/seed.ts
fi

exec npx next start -p "${PORT:-3000}" -H "${HOSTNAME:-0.0.0.0}"

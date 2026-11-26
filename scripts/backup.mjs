// Creates a consistent snapshot of the SQLite database in ./backups using VACUUM INTO,
// which is safe to run while the app is serving requests.
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const KEEP = 14;
const dir = resolve("backups");
mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const target = join(dir, `wadi-${stamp}.db`);

const prisma = new PrismaClient();
try {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replace(/\\/g, "/").replace(/'/g, "''")}'`);
  const size = (statSync(target).size / 1024).toFixed(1);
  console.log(`Backup written: ${target} (${size} KB)`);

  // Retention: keep the newest KEEP backups.
  const old = readdirSync(dir)
    .filter((f) => f.startsWith("wadi-") && f.endsWith(".db"))
    .sort()
    .reverse()
    .slice(KEEP);
  for (const f of old) unlinkSync(join(dir, f));
  if (old.length) console.log(`Removed ${old.length} old backup(s).`);
} finally {
  await prisma.$disconnect();
}

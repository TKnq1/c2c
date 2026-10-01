// Runs before `next build` (see package.json), so every Vercel deploy brings
// the database schema up to date first. If a migration fails, the build
// fails and Vercel keeps serving the previous deployment.
import { execSync } from "node:child_process";
import "dotenv/config";

// Prisma Migrate needs a direct connection, not Neon's pooler (it can't
// hold the lock migrations take). Neon's Vercel integration provides one;
// otherwise derive it from the pooled host (ep-…-pooler → ep-…).
const pooledOrDirect =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
if (!pooledOrDirect) {
  console.log("No database URL set, skipping migrations.");
  process.exit(0);
}

const url = new URL(pooledOrDirect.replace(/(ep-[a-z0-9-]+?)-pooler\./, "$1."));
// A suspended Neon database takes a few seconds to wake up, longer than
// Prisma's default 5s connect timeout (that surfaced as P1002).
if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "30");

const ATTEMPTS = 3;
for (let attempt = 1; ; attempt++) {
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url.toString() },
    });
    break;
  } catch (err) {
    if (attempt === ATTEMPTS) throw err;
    console.log(`Migration attempt ${attempt} failed, retrying in 10s…`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

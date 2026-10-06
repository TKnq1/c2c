// Runs before `next build` (see package.json), so every production deploy
// brings the database schema up to date first. If a migration fails, the
// build fails and Vercel keeps serving the previous deployment.
import { execSync } from "node:child_process";
import "dotenv/config";

// A preview build gets whatever DATABASE_URL the project gives previews, and
// here that's the database the live site runs on. It must not change that
// schema: a branch's migration would hit production before the branch is
// merged, and a failing or destructive one would take the live site down
// with it. Only production builds migrate (locally VERCEL_ENV isn't set, so
// `npm run build` still does); a preview's migration is applied by
// `npm run db:deploy` or by the production build once it's merged.
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  console.log(`VERCEL_ENV is "${process.env.VERCEL_ENV}", not a production build: skipping migrations.`);
  process.exit(0);
}

// Emergency switch: SKIP_MIGRATIONS=1 in the project's environment variables lets a build go through
// without touching the database, e.g. while the build machines can't reach it but the schema is already
// current. Remove it again afterwards: with it set, new migrations are NOT applied.
if (process.env.SKIP_MIGRATIONS === "1") {
  console.log("SKIP_MIGRATIONS=1: not running migrations.");
  process.exit(0);
}

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

// Prisma's advisory lock kept timing out on Vercel (P1002) while another
// session held it. Deploys run one at a time here, so skip it.
const env = { ...process.env, DATABASE_URL: url.toString(), PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" };

// A draft of the multi-niche migration never reached main, but preview builds
// ran it against this database back when previews still migrated. A run that
// failed is on record as failed, and Prisma then refuses every migration
// after it (P3009). The draft is gone and its replacement copes with whatever
// it left behind, so mark it rolled back. Prisma refuses (and nothing
// changes) unless it's on record as failed.
const ABANDONED_DRAFT = "20261002170000_creator_niches";
try {
  execSync(`npx prisma migrate resolve --rolled-back ${ABANDONED_DRAFT}`, { stdio: "pipe", env });
  console.log(`Marked the abandoned ${ABANDONED_DRAFT} migration as rolled back.`);
} catch {
  // Not on record as failed: nothing to do.
}

const ATTEMPTS = 3;
for (let attempt = 1; ; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", env });
    break;
  } catch (err) {
    if (attempt === ATTEMPTS) throw err;
    console.log(`Migration attempt ${attempt} failed, retrying in 10s…`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
}

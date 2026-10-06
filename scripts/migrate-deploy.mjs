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
// DATABASE_URL works too once its pooled host (ep-…-pooler) is turned into
// the direct one (ep-…). Each is tried in turn, so a stale one (an old
// password, an endpoint that is gone after a branch reset) can't fail the
// build while another one works.
const URL_VARIABLES = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL"];
const candidates = [];
let anySet = false;
for (const name of URL_VARIABLES) {
  const raw = process.env[name];
  if (!raw) continue;
  anySet = true;
  let url;
  try {
    url = new URL(raw.trim().replace(/(ep-[a-z0-9-]+?)-pooler\./, "$1."));
  } catch {
    console.log(`${name} is not a valid URL, ignoring it.`);
    continue;
  }
  // A suspended Neon database takes a few seconds to wake up, longer than
  // Prisma's default 5s connect timeout (that surfaced as P1002).
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "30");
  if (!candidates.some((c) => c.url === url.toString())) candidates.push({ name, url: url.toString() });
}
if (candidates.length === 0) {
  if (anySet) {
    console.error("None of the database URLs is valid.");
    process.exit(1);
  }
  console.log("No database URL set, skipping migrations.");
  process.exit(0);
}

// A draft of the multi-niche migration never reached main, but preview builds
// ran it against this database back when previews still migrated. A run that
// failed is on record as failed, and Prisma then refuses every migration
// after it (P3009). The draft is gone and its replacement copes with whatever
// it left behind, so mark it rolled back. Prisma refuses (and nothing
// changes) unless it's on record as failed.
const ABANDONED_DRAFT = "20261002170000_creator_niches";
function markAbandonedDraftRolledBack(env) {
  try {
    execSync(`npx prisma migrate resolve --rolled-back ${ABANDONED_DRAFT}`, { stdio: "pipe", env });
    console.log(`Marked the abandoned ${ABANDONED_DRAFT} migration as rolled back.`);
  } catch {
    // Not on record as failed: nothing to do.
  }
}

// P1000 authentication failed, P1001 can't reach the server, P1002 timed out, P1008 operation timed out,
// P1011 TLS error, P1017 the server closed the connection: the database wasn't (properly) reached, so
// another URL is worth a try. Anything else is the migration itself failing, which would fail the same
// way through any URL to this database.
const CONNECTION_ERROR = /\bP(1000|1001|1002|1008|1011|1017)\b/;

function deploy(env) {
  try {
    process.stdout.write(execSync("npx prisma migrate deploy", { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
    return { ok: true, output: "" };
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    process.stdout.write(output);
    return { ok: false, output };
  }
}

for (const [i, candidate] of candidates.entries()) {
  const isLast = i === candidates.length - 1;
  // Prisma's advisory lock kept timing out on Vercel (P1002) while another
  // session held it. Deploys run one at a time here, so skip it.
  const env = { ...process.env, DATABASE_URL: candidate.url, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" };
  console.log(`Running migrations through ${candidate.name}.`);
  markAbandonedDraftRolledBack(env);

  const attempts = isLast ? 3 : 2;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = deploy(env);
    if (result.ok) process.exit(0);
    if (!CONNECTION_ERROR.test(result.output)) process.exit(1);
    if (attempt < attempts) {
      console.log(`Migration attempt ${attempt} failed, retrying in 10s…`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
  if (!isLast) console.log(`Could not reach the database through ${candidate.name}, trying the next URL.`);
}

console.error("The database could not be reached through any of the configured URLs.");
process.exit(1);

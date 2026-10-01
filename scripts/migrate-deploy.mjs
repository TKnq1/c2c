// Runs before `next build` (see package.json), so every Vercel deploy brings
// the database schema up to date first. If a migration fails, the build
// fails and Vercel keeps serving the previous deployment.
import { execSync } from "node:child_process";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL isn't set, skipping migrations.");
  process.exit(0);
}

// Prisma Migrate needs a direct connection; Neon's pooled host (ep-…-pooler)
// can't hold the lock it takes. Same database, without "-pooler".
const directUrl = url.replace(/(ep-[a-z0-9-]+?)-pooler\./, "$1.");

execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: directUrl } });

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read plainly, not through env("DATABASE_URL"), which throws when the
    // variable is missing: `prisma generate` runs in every install
    // (postinstall) and needs no database, so a build without one still has
    // to get through it. The commands that do need it say so themselves.
    url: process.env.DATABASE_URL,
  },
});

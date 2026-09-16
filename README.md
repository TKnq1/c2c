# C2C — Brand-Creator Marketplace

MVP prototype: brands post collab requests (niche, minimum follower count, product
category), creators see matching requests in their feed and reach out with one click
("I'm interested") for direct contact. Monetized via commission: brands pay creators
through the platform, funds are held in escrow until the creator marks the work as
posted, and the platform keeps a 10% fee (3% for brands on the optional $49/month Pro
plan) — no real payment is processed, it's a simulated escrow and a simulated
subscription.

## Setup

```bash
npm install                                  # runs `prisma generate` via postinstall
npx prisma migrate dev --name init           # creates dev.db and the schema
npm run db:seed
npm run dev
```

Copy `.env.example` to `.env` and fill in `AUTH_SECRET` (`openssl rand -base64 33`)
first — `DATABASE_URL` already points at the local SQLite file. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` /
`VAPID_PRIVATE_KEY` (push notifications) and `NEXT_PUBLIC_SITE_URL` are optional —
everything works without them.

## Demo accounts (password for all: `password123`)

| Email | Role | Details |
|---|---|---|
| startup1@example.com | Brand | Glow Beauty Co — has an interested creator (Mia Summers) not yet paid; try the "Pay creator" form |
| startup2@example.com | Brand | FitTech Labs — on the Pro plan (3% fee); has a completed, released payment to Jonas Fit ($500, history view) |
| startup3@example.com | Brand | TasteBox |
| startup4@example.com | Brand | StyleHub — has a payment held in escrow for Sara Trend ($300) |
| creator1@example.com | Creator | Beauty, Instagram 50,000 + TikTok 12,000 (multi-platform demo); interested in a Glow Beauty Co request, unpaid |
| creator2@example.com | Creator | Beauty, 3,000 followers (sees fewer requests — follower gating) |
| creator3@example.com | Creator | Fitness, 20,000 followers; has a released $500 payment from FitTech Labs |
| creator4@example.com | Creator | Food, 100,000 followers |
| creator5@example.com | Creator | Fashion, 10,000 followers; has a $300 payment held in escrow from StyleHub — try "Mark as posted & release payment" |

`npm run db:reset` resets the database back to this starting state.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 + SQLite (better-sqlite3 driver adapter) ·
NextAuth v5 (Credentials, JWT) · Tailwind CSS v4 · Zod

## Scripts

- `npm run dev` — dev server
- `npm run db:migrate` — create a new migration (local/dev database)
- `npm run db:deploy` — apply existing migrations without creating new ones (production)
- `npm run db:seed` — reseed demo data
- `npm run db:studio` — Prisma Studio (DB browser)
- `npm run db:reset` — reset DB + reseed

## Deployment

Local dev runs on SQLite, but Vercel's serverless functions have no persistent
filesystem — a SQLite file won't survive between requests there, so this needs to
switch to Postgres first. That switch was prototyped once already and reverted (see
git history / ask if picking this back up) — it touches `prisma/schema.prisma`
(`provider = "postgresql"`), `src/lib/prisma.ts` and `prisma/seed.ts` (swap
`@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg`), and needs a fresh
migration (the current one is SQLite-flavored SQL, not portable to Postgres).

0. **Redo the SQLite → Postgres switch** described above, once a real Postgres
   connection string exists (step 1) to generate the fresh migration against.
1. **Database** — provision a Postgres instance. The friction-free option is adding
   **Vercel Postgres** (Storage tab → Create Database, Postgres/Neon) directly to the
   Vercel project once it exists — it injects `DATABASE_URL` automatically, no copy-
   pasting a connection string. Supabase, Neon, or any other Postgres host works too;
   just set `DATABASE_URL` manually in that case.
2. **Push the repo to GitHub** (this project has no remote configured yet):
   ```bash
   git add -A
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
3. **Import the repo into Vercel** (vercel.com → Add New → Project → pick the repo).
   Framework preset auto-detects as Next.js — no changes needed there.
4. **Set environment variables** in the Vercel project settings: `DATABASE_URL` (if
   not auto-injected by step 1), `AUTH_SECRET`. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` /
   `VAPID_PRIVATE_KEY` and `NEXT_PUBLIC_SITE_URL` are optional.
5. **Apply migrations to the production database once**, from a local machine, before
   (or right after) the first deploy:
   ```bash
   DATABASE_URL="<the production connection string>" npm run db:deploy
   DATABASE_URL="<the production connection string>" npm run db:seed   # optional demo data
   ```
6. Deploy. Re-run step 5's `db:deploy` (not `db:seed`, which would duplicate demo data)
   after any future schema change, before or after pushing the code that needs it.

Email is simulated throughout (password reset and email verification links are shown
directly in the UI instead of sent, since no mail provider is wired up) — expected
behavior, not a bug, when trying this deployed.

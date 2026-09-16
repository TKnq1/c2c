# C2C — Brand-Creator Marketplace

MVP prototype: brands post collab requests (niche, minimum follower count, product
category), creators see matching requests in their feed and reach out with one click
("I'm interested") for direct contact. Monetized via commission: brands pay creators
through the platform, funds are held in escrow until the creator marks the work as
posted, and the platform keeps a 10% fee (3% for brands on the optional $49/month Pro
plan) — no real payment is processed, it's a simulated escrow and a simulated
subscription.

## Setup

Needs a Postgres database — copy `.env.example` to `.env` and fill in `DATABASE_URL`
(a Neon connection string, or any other Postgres host) and `AUTH_SECRET`
(`openssl rand -base64 33`). `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
(push notifications) and `NEXT_PUBLIC_SITE_URL` are optional — everything works
without them.

```bash
npm install         # runs `prisma generate` via postinstall
npm run db:migrate  # applies prisma/migrations to whatever DATABASE_URL points at
npm run db:seed
npm run dev
```

This project currently points local dev and production at the **same** Neon
database (one-person prototype, simplest setup). Once real users exist, stop
running `db:reset`/`db:seed` against it — reseeding wipes everything. Neon
supports branching a separate dev database off the production one if that split
becomes worth it later.

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

Next.js 16 (App Router) · TypeScript · Prisma 7 + Postgres (`pg` driver adapter, hosted on Neon) ·
NextAuth v5 (Credentials, JWT) · Tailwind CSS v4 · Zod

## Scripts

- `npm run dev` — dev server
- `npm run db:migrate` — create a new migration (local/dev database)
- `npm run db:deploy` — apply existing migrations without creating new ones (production)
- `npm run db:seed` — reseed demo data
- `npm run db:studio` — Prisma Studio (DB browser)
- `npm run db:reset` — reset DB + reseed

## Deployment

Built for Vercel. The database is already Postgres (Neon) for exactly this reason —
Vercel's serverless functions have no persistent filesystem, so the original SQLite
file wouldn't have survived between requests there.

1. **Push the repo to GitHub**, then **import it into Vercel** (vercel.com → Add New
   → Project → pick the repo). The Next.js framework preset is auto-detected.
2. **Add the same Neon database to the Vercel project** (Storage tab → the existing
   Neon integration) so `DATABASE_URL` is injected automatically — or set it manually
   in Settings → Environment Variables if using a separate database for production.
3. **Set `AUTH_SECRET`** in Settings → Environment Variables. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` /
   `VAPID_PRIVATE_KEY` and `NEXT_PUBLIC_SITE_URL` are optional.
4. **Deploy.** The schema is already applied to this database (step above pointed at
   it), so no separate migration step is needed for the first deploy. After any
   future schema change, run `DATABASE_URL="<production URL>" npm run db:deploy`
   before or after pushing the code that needs it.
5. **Custom domain** — optional, add anytime later in Settings → Domains, then point
   the DNS record your registrar shows you at Vercel. Not required to go live on the
   assigned `*.vercel.app` URL first.

Email is simulated throughout (password reset and email verification links are shown
directly in the UI instead of sent, since no mail provider is wired up) — expected
behavior, not a bug, when trying this deployed.

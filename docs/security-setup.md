# Security setup

What the code can't do on its own: settings in Vercel, Neon, Stripe and GitHub that the security audit relies on.

## Vercel
- **Environment variables, split by environment.** Production and Preview must not share secrets.
  - Preview: Stripe *test* keys and test webhook secrets, its own `AUTH_SECRET`, a Resend key for a sandbox domain, **no** `CRON_SECRET`.
  - Production: the live values. New: `TOTP_ENCRYPTION_KEY`, `RECOVERY_CODE_PEPPER`, `OPT_OUT_SECRET` (see `.env.example`).
- **Deployment Protection:** turn on Vercel Authentication for Preview deployments, so a branch URL isn't public.
- `DATABASE_URL_PREVIEW`: see Neon below. Without it a preview connects to the database in `DATABASE_URL` and logs a warning.

## Neon
- Vercel integration: enable *Create a branch for each preview deployment*. Previews then run on a copy, not on live data.
  Migrations are applied to the production database by the production build only; a preview branch gets them with `npm run db:deploy`.
- Restrict who can reach the production branch's connection string.

## Stripe
- Webhook endpoints: `/api/webhooks/stripe` and `/api/webhooks/stripe-account`, each with its own signing secret.
- Use restricted API keys where possible; keep live and test keys apart (Preview = test).

## GitHub
- Settings → Code security: turn on *Dependabot alerts*, *secret scanning* and *push protection*.
- Branch protection on `main`: require the `CI` workflow to pass.

## After deploying the security changes
1. Set the new variables above (they are optional, features degrade to the previous behaviour without them).
2. Seal the existing two-factor secrets once: `TOTP_ENCRYPTION_KEY=… DATABASE_URL=… node scripts/seal-totp-secrets.mjs`.
3. Admin accounts need two-factor authentication; open `/admin` and follow the prompt.

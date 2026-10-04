<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Local Postgres is installed on the VM. On boot, the environment start script starts it, writes `.env` (`DATABASE_URL` and `AUTH_SECRET`) when that file is missing, applies Prisma migrations, and seeds demo users when the user table is empty. It then runs the Next.js dev server.

- Open the app at http://localhost:3000. Next.js 16 blocks dev resources when the page is opened at `127.0.0.1`, and the login form will not submit there.
- Demo accounts are listed in the README. Every demo password is `password123`.
- `npm run lint` and `npm test` do not need extra services beyond what start already brought up.

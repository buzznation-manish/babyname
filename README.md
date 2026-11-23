# Baby Name Recommendation Platform

Next.js App Router application using TypeScript, Tailwind CSS, Supabase authentication and PostgreSQL through Prisma.

## Structure

- `app/` — App Router pages and global styles
- `app/api/` — API route boundary reserved for later steps
- `app/(routes)/` — grouped application routes reserved for later steps
- `components/` — reusable UI components
- `lib/` — application and domain utilities
- `prisma/` — Prisma schema and migrations

## Run locally

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env` and securely fill in your development project settings first. Runtime database access uses `SUPABASE_DATABASE_URL`; Prisma migration operations use `DIRECT_URL`. Do not commit secrets. The lockfile currently needs reconciliation with the manifest, so `npm ci` rejects it.

## Application flow

`/signup` or `/login` → `/baby-profile` → `/recommendations` → `/names/[id]`.

Public browsing is available at `/names`. Recommendations use saved gender, starting syllable, maximum length and supported style categories. They do not calculate astrology or numerology.

## Checks

```sh
npx tsx --test tests/recommendations.test.ts
npm run lint
npx prisma generate
npm run build
```

## Vercel

Set Production variables `SUPABASE_DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` securely. Keep the build command `npx prisma generate && npm run build`. Deploy the commit containing the new routes. Variable changes require a new deployment; deployment does not migrate or seed your database.

Configure Supabase's site URL and `/auth/callback` redirect for the deployed hostname. Do not apply migrations or seeds to a shared database before checking its state and intended scope.

See [progress, current limitations and the five-hour daily plan](docs/PROGRESS.md).

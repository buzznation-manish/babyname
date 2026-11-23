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

Copy `.env.example` to `.env` and securely fill in your development project settings first. Runtime database access uses `SUPABASE_DATABASE_URL`; Prisma migration operations use `DIRECT_URL`. Do not commit secrets. Use `npm ci` for a clean install from the committed lockfile.

## Application flow

The home page `/` provides a name/meaning search, category inspiration, a journey guide and direct links to all current features. Shared navigation remains available throughout the app and retains a valid selected `profileId` on family-related links.

`/signup` or `/login` → `/baby-profile` → `/recommendations` → `/names/[id]`.

Manage all your babies at `/baby-profile`: use **Add another baby** for a new record, or select **Edit** for an existing one. Links use `profileId` to preserve the selected baby across editing, recommendations, name details and shortlist. Saving redirects to recommendations for the returned profile ID. There is no profile-delete operation in this milestone.

Public browsing is available at `/names`. Recommendations use saved gender, starting syllable, maximum length and supported style categories. They do not calculate astrology or numerology.

Save/remove names from recommendations or name details, then visit `/shortlist` for the selected baby's saved names. The API at `/api/saved-names` requires an authenticated account and verifies baby-profile ownership for every operation. Apply the reviewed saved-name policy hardening in `supabase/migrations/20261123000000_harden_saved_names_ownership.sql` to the intended Supabase database; deploying to Vercel does not apply SQL policies. See [shortlist release checks](docs/RELEASE-2.md).

## Checks

```sh
npm test
npm run lint
npx prisma generate
npm run build
```

## Vercel

Set Production variables `SUPABASE_DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` securely. Keep the build command `npx prisma generate && npm run build`. Deploy the commit containing the new routes. Variable changes require a new deployment; deployment does not migrate or seed your database.

Configure Supabase's site URL and `/auth/callback` redirect for the deployed hostname. Do not apply migrations or seeds to a shared database before checking its state and intended scope.

The header shows Log out after the browser's initial auth session is available. Logout signs out the current Supabase session and fully redirects to login, clearing private client navigation state. Server pages/APIs still verify authentication independently. Auth pages check Supabase's public provider settings for Google availability; an enabled provider flag does not verify the full OAuth setup. See [auth release checks](docs/RELEASE-5.md).

See [progress, current limitations and the five-hour daily plan](docs/PROGRESS.md).

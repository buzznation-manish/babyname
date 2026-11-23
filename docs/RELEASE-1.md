# First implementation milestone

Prepared 23 November 2026 following authorization to commit and push changes to GitHub main. No production database migration, seed, table change or credential change is part of this release.

## What to expect

Keep the existing baby-profile success redirect to `/recommendations`. The new authenticated page uses the account's own profiles and suggests names using gender, explicit syllable, maximum character length and supported category styles. It supports profile selection for existing multiple profiles, pagination, empty results and retry UI. `/names/[id]` shows meaning and name details; links are available from recommendations and public browsing.

This is a preference-based recommendation foundation. It does not implement the document's astrology, numerology, persisted score breakdown, shortlist, voting or payment features. Unsupported styles and unused birth/religion inputs are explained rather than given fabricated scores.

## Deployment settings

- Keep Build Command: `npx prisma generate && npm run build`.
- Keep Production `SUPABASE_DATABASE_URL` pointing to the existing intended Supabase database. The locked Prisma Postgres `DATABASE_URL` is not the runtime source used by this schema.
- Retain `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as configured for the intended project.
- Use the latest main commit containing both recommendation routes and dependency maintenance. A successful Git push does not establish deployment success.

## Checks completed here

- Five recommendation unit tests passed via `npm test`.
- ESLint passed on Next.js 15.5.29.
- Source and generated Next route type checks passed using actual schema-derived Prisma declarations in an isolated external type-check configuration.
- Clean frozen install (`npm ci`) passed after lockfile reconciliation.
- Production dependency audit reported zero known vulnerabilities. Next.js 14.2.35 still had reported advisories, so the maintained 15.5 patch was selected. PostCSS is overridden to the tested direct version to address the remaining transitive advisories.
- Production JavaScript compilation passed on Next.js 15.5.29. Ordinary full build remains unverified: normal Prisma generation receives proxy HTTP 403 at `binaries.prisma.sh` in this workspace, leaving the installed client's model declarations unavailable to ordinary build checking. No checksum/TLS verification was disabled. No Supabase credentials are injected here, so authenticated/database execution was not verified.

## Check after Vercel deployment

1. Open the deployment for the new source commit and confirm Ready.
2. Log in with an authorized demo account, save a baby profile and confirm `/recommendations` opens without 404.
3. Use a supported style (Modern, Spiritual or Nature) and verify gender, syllable and maximum-letter preferences. Confirm a no-match case displays guidance.
4. Click Explore name and confirm meaning/details load. Verify a malformed detail ID shows not-found UI.
5. Check pagination when there are more than 12 results. Existing multiple profiles should only show the signed-in account's data.
6. If the deployed flow fails, inspect fresh `/recommendations` runtime logs for that deployment, redacting credentials before sharing.

Next bounded milestone: complete multiple-profile creation/selection and ownership-safe shortlist save/list/remove, then add approved engine inputs and persisted scoring rules.

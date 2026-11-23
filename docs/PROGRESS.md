# Project progress and daily plan

Updated: 23 November 2026. Availability: 5 hours per working day.

## Scope and evidence

The uploaded `Database_Schema_For_Development.docx` has now been reviewed against the code. It supplies a 16-table schema guide and high-level product flow; scoring formulas, detailed screens, data sources, premium rules and the deadline still need definition. See [the document-to-code audit](DEVELOPMENT-AUDIT.md) for the updated status, schema gaps and recommended order. The earlier five-session outline below was for a basic demo, not the full documented platform.

| Capability | Status | Remaining work |
| --- | --- | --- |
| Email signup/login and user sync | Existing; user-tested on Vercel | Email-confirmation path needs testing: code currently attempts user sync before checking whether a session exists. |
| Google OAuth | Code exists; unverified | Configure and test provider and callback. |
| Baby profile create/update | Existing; user-tested on Vercel | Retain `/recommendations` redirect; verify validation and multiple-profile behavior. |
| Names browsing/filtering | Existing; user reported working | Production uses `SUPABASE_DATABASE_URL`. |
| Recommendations | Deployed happy path user-tested | User confirmed signup → profile → recommendations → Explore name. Filter edge cases and account isolation still need deployed checks. |
| Name details | Deployed happy path user-tested | User confirmed Explore name opens. Invalid/missing ID and failure cases still need deployed checks. |
| Shortlist | Implemented; deployed validation pending | Save/remove buttons, per-baby page, authenticated GET/POST/DELETE API, profile ownership and repeat-save handling. See RELEASE-2.md; new SQL policy hardening is prepared but not applied here. |
| Astrology/numerology | Schema only | Agree calculation rules and validate inputs/data; no invented scores. |
| Recommendation history | Schema only | Current suggestions are computed on request, not persisted. |
| Voting, audio and trends | Schema/policies and sample fields | Product flows, real data, endpoints and UI. |
| Premium/payments | Subscription schema only | Decide scope, provider, prices and entitlements. |
| Dependencies/security | Updated and checked | Next.js and eslint-config-next 15.5.29, PostCSS 8.5.33 (including Next's transitive dependency), refreshed lockfile. npm ci passes; production npm audit reports zero known vulnerabilities at this check. Access-control review remains. |

## Implemented matching rules

- Boy/girl preferences allow the selected gender and unisex names. A unisex profile allows all genders.
- Starting syllable matches the stored syllable case-insensitively; maximum length is a hard filter. Filters are never silently relaxed.
- Modern, Spiritual and Nature styles prioritize matching categories; unsupported styles are explained on the page.
- Ties use popularity, trend, name and ID. No AI, compatibility percentage, astrology or numerology score is invented.
- At most the 200 most popular matches are ranked; the UI discloses this limit. Pagination shows 12 names per page.
- Birth details and religion are saved but do not affect these suggestions.
- Profiles are loaded only for the authenticated application user before selecting a profile ID.

## Validation

From the project root:

```sh
npx tsx --test tests/recommendations.test.ts
npm run lint
npx prisma generate
npm run build
```

Twelve unit/handler tests (five recommendations and seven shortlist) and lint pass. A separate complete source type-check also passes against actual schema-derived Prisma declarations generated with Prisma 5.22's official WASM parser and type generator, with the library import mapped to the installed Prisma runtime declarations in an external type-check configuration. This does not install a runtime engine or change application type settings. Prior production JavaScript compilation passed for the recommendations milestone.

The ordinary `npm run build` did not complete: the installed runtime client lacks the generated model types. Normal generation is blocked by proxy HTTP 403 at `binaries.prisma.sh`. Authenticated/database checks remain unverified because no database/Supabase variables are injected. Keep checksum and TLS verification enabled. No production database changes were made. Use normal `npx prisma generate && npm run build` on Vercel; the external type-check configuration is only a local diagnostic aid, not a deployment workaround.

After deployment, verify:

1. Signed-out recommendations redirect to login; accounts without profiles go to baby-profile.
2. Save/update a profile and arrive at recommendations without 404.
3. Matching and no-match preferences, unsupported styles, profile selection and pagination work.
4. Another test account's profile ID never reveals its data.
5. Name details work from both browsing and suggestions; invalid/missing IDs show not-found UI.
6. Database outages show retry UI without exposing credentials.

## Five-hour daily plan

Budget approximately 3 hours implementation, 1 hour testing/fixes, and 1 hour review/deployment/progress tracking. Finish unresolved acceptance checks before adding scope. These are planning budgets, not scheduled autonomous work or guaranteed delivery dates.

| Session | Target |
| --- | --- |
| 1 | Recommendation foundation and name details. Code prepared; finish build and deployed acceptance checks. |
| 2 | Auth edge cases, shortlist and dependency maintenance; carry work forward if patching takes longer. |
| 3 | Approved recommendation rules and real dataset improvements. Astrology requires an agreed method first. |
| 4 | Navigation, mobile usability and complete signup-to-shortlist flow. |
| 5 | Client demo rehearsal with demo data, resolve blockers, document steps. |

Payments, voting, audio and advanced astrology/numerology need estimates after the complete flow is supplied. Session 5 is a review target, not a promise that all features will be complete.

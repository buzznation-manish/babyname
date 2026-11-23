# Multiple baby profiles

Prepared 23 November 2026 after the user confirmed live shortlist Save → Refresh → Remove behavior. This milestone uses existing tables. No schema migration, production SQL, seed or destructive operation is part of it.

## What changes

- `/baby-profile` lists the authenticated account's profiles. With existing profiles it opens the latest one by default, preserving the previous entry behavior; with none it shows a blank first-profile form.
- `/baby-profile?new=1` is explicit creation mode. Add another baby always starts a blank form and sends POST, even if the account already has babies.
- `/baby-profile?profileId=UUID` loads that owned profile for editing. Unknown/foreign/ambiguous IDs show unavailable UI and never silently fall back to editing the latest child.
- Forms are keyed by selected profile/new mode, resetting local values when switching. Identity and userId are not copied into editable payloads. Inputs are disabled while saving; an unmounted form cancels its client request and cannot redirect from a stale response. Cancellation does not guarantee a server write that already completed is undone.
- Save/update still goes to `/recommendations`, now with the exact returned profileId. Editing an older baby no longer redirects to the most recently created baby's suggestions.
- Recommendations' Edit/Update preferences links and shortlist's Manage baby profiles link retain profileId. Existing recommendation/shortlist/detail selectors and links continue to keep saved names per baby.
- New loading/error states accompany the server-loaded profile manager.
- Profile deletion is intentionally absent; the database cascades associated shortlist/recommendation/vote data on deletion, and deletion was not requested.

## API and validation

The existing `/api/baby-profiles` GET/POST/PUT paths remain. All operations authenticate, derive the account ID on the server and return private/no-store JSON. GET returns only the account's profiles, ordered by creation then ID. POST creates a new profile; client-supplied id/userId are not applied. PUT updates by both id and authenticated userId inside a transaction and returns 404 for unavailable/foreign records.

Only editable fields are accepted. Input validation includes actual ISO calendar dates (including leap years; future expected dates are valid), valid optional 24-hour time with optional seconds, text lengths matching the schema, recognized gender and integer maximum name length 1–100 letters. Unsupported content types, malformed JSON and cross-origin mutations are rejected. Birth/religion fields remain stored inputs; this milestone does not add astrology/numerology calculations.

API serialization returns date-only strings and omits userId/createdAt metadata. The form and name-shortlist panel remain compatible with the record shape they use.

## Checks

- 25 tests pass (`npm test`): 13 profile tests plus the previous 12 recommendation/shortlist tests.
- Profile tests cover new/edit selection, invalid IDs without fallback, independent form defaults, metadata exclusion, invalid/valid dates and time/length limits, unauthenticated access, account-scoped listing, new creation without overwriting either existing child, updating just the selected child, cross-account update rejection, request validation and safe server errors.
- Handler tests use injected stores and real Request/Response objects; they are not PostgreSQL or browser end-to-end tests.
- Lint, Next route type generation and the isolated schema-derived Prisma source type-check pass. Production JavaScript compilation passed. The ordinary build stops during type checking because normal Prisma generation remains blocked by the known engine-download restriction and installed client model declarations are absent; no type-check or TLS/checksum verification is disabled in application configuration.
- Authenticated browser/database verification is pending deployment. Retain Vercel Build Command `npx prisma generate && npm run build` and existing variables. No new SQL step is required for this milestone.

## Vercel acceptance checks

1. Log in to the existing demo account; the existing baby and its shortlist must still be present.
2. From recommendations choose Add another baby. Confirm the form is blank, then create a distinctly named second baby with different preferences. Save should open that baby's recommendations.
3. Open Manage/Edit baby profiles. Both babies should be listed. Edit the first baby's preferences; save should return to that first baby's recommendations and leave the second unchanged.
4. Save different names for each baby. Switch the recommendation/shortlist selector, open details, and return: selected profile and saved names should remain correct. Refresh and re-login should preserve the records.
5. Use a preference with no results and click Update preferences: the selected baby's form should open.
6. With a second authorized test account, ensure another account's profile URL displays unavailable and PUT rejects it. Signed-out access must redirect or return 401.
7. Check validation feedback for invalid dates/overlong fields and retry behavior for server errors. Do not delete/reset production profiles as a test.

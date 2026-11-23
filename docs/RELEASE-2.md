# Shortlist milestone

Prepared 23 November 2026, after the user confirmed the deployed signup → baby profile → recommendations → Explore name happy path.

## Behavior

- Recommendations include a Save to shortlist / Remove from shortlist button for the selected baby and a Your shortlist navigation link.
- Name details retain the selected profile in their URL. The save panel loads only the signed-in account's profiles, offers a profile selector, and checks the saved state before enabling a mutation. Signed-out visitors can still read name details and are offered sign-in to save.
- `/shortlist?profileId=...` lists that baby's saved names, with details links, removal, an empty state and existing-profile selection. Multiple-profile creation is the next milestone.
- Writes use the existing SavedName model/unique baby-name constraint. Repeated saves use upsert; repeated removal is safe. No name/baby/user data is deleted by removing a shortlist entry.
- Save errors do not silently toggle the button. Refresh updates recommendation state and the shortlist. API responses are private/no-store; profile/saved-state requests do not use the browser cache and canceled requests cannot replace the chosen profile's state.
- Session middleware covers the new page and preserves all refreshed cookie chunks.

## API authorization

`GET /api/saved-names?profileId=UUID`, `POST /api/saved-names`, and `DELETE /api/saved-names` require authentication. Mutation JSON is `{ "profileId": "...", "nameId": "..." }`. The server obtains userId from the authenticated session; client-supplied userId is ignored. Every operation checks profile ownership before reading or writing saved names. Save verifies the name exists. Cross-origin mutations, malformed JSON, invalid IDs and unsupported body types are rejected. Errors do not return database internals.

## Supabase SQL policy step

The original saved-name policies checked saved_names.user_id but did not establish ownership of the referenced baby profile. The new transactional SQL migration replaces those four policies so both relationships must match the signed-in account.

**It was not applied to a live database here.** Vercel deploys source, not Supabase SQL. Before using this feature with real customer data, apply the reviewed `supabase/migrations/20261123000000_harden_saved_names_ownership.sql` through the project's normal Supabase migration workflow, or paste its complete contents into the SQL Editor for the intended project. Confirm it is the project containing your application tables. It changes policies only; it does not create/drop tables or modify rows. Do not run all historical schema migrations against an already populated database just to apply this file. Verify the resulting policies and cross-account behavior with two development accounts. Actual table grants, deployed RLS state and policy execution were not verified here.

The Next API performs its own checks for direct Prisma access; SQL policies additionally protect access through Supabase's authenticated data API. Shipping the source does not prove this separate policy step has been completed.

## Validation and deployment checks

Twelve tests pass via `npm test`: five ranking/filter tests and seven shortlist handler tests. The latter use an injected store and real Request/Response objects, covering signed-out access, cross-account profile IDs, forged user IDs, repeat save/removal, invalid/missing names/IDs, cross-origin/bad-body requests and safe server errors. They do not constitute live PostgreSQL/RLS or browser end-to-end tests. Lint, Next route-type generation and the schema-derived isolated source type-check pass. Production JavaScript compilation also passed. The ordinary full build stops during type checking because the locally installed Prisma client lacks its generated models; normal generation is blocked by the previously documented download restriction. Authenticated database/browser testing remains unverified. Vercel should retain `npx prisma generate && npm run build`.

After the new deployment is Ready:

1. Log in, open recommendations, save one name and open Your shortlist. Verify it appears once.
2. Refresh the browser: the saved state and entry should persist. Remove the name and verify it disappears and the recommendation button returns to Save.
3. Open a name's details and save/remove there. The intended baby profile must remain selected across navigation.
4. If you already have multiple baby profiles, confirm lists/actions stay separate for each. New profile creation/management UI remains pending.
5. Signed-out `/shortlist` should redirect to login. Public name details remain readable with a sign-in prompt for saving.
6. With two authorized development accounts, verify profile IDs from the other account return 404 and no data is revealed or changed. Independently verify the Supabase data API after applying the SQL policies.
7. If the API reports 500, inspect fresh Vercel runtime logs for `/api/saved-names` and confirm the expected existing `saved_names` table/constraints are present. Do not reset the database or paste credentials in chat.

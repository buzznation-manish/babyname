# Home page, navigation and loading improvements

Prepared 23 November 2026 after the user confirmed the multi-profile flow works and requested a designed home page plus improved loading.

## Design and navigation

- Responsive cream/sage/peach home page with serif headlines, name-inspiration cards, search, category links, three-step journey guidance, family-space shortcuts and footer links.
- Shared sticky header links to Browse names, Baby profiles, Recommendations and Shortlist; login/signup remain easy to find. The logo always returns home. Mobile links are fully visible rather than clipped in a long horizontal row.
- Header family links retain a valid profileId from the current URL. This does not replace existing server ownership checks.
- Home search and Nature/Spiritual/Modern links open actual browse filters. Direct `/names?search=...&gender=...&category=...` links initialize the browser controls correctly. Ambiguous arrays/invalid genders are ignored and input lengths bounded.
- Keyboard skip link, visible focus, semantic sections/form labels, loading status and reduced-motion-friendly skeletons are included.
- Name cards are static inspiration linked to catalogue searches, not personalized recommendations, live counts or testimonials. No future astrology/numerology features are advertised as available.

## Loading changes

1. The home page has no database/auth dependency. The shared header displays navigation without a session request. It uses a Suspense fallback for URL-aware navigation, allowing public home content to render independently.
2. No downloaded fonts, remote images, video or new runtime dependency is required. Graphics use CSS and small inline SVG icons.
3. Protected home/header links do not automatically prefetch authenticated pages, reducing unnecessary background auth work just from landing on the public page.
4. Browse search cancels obsolete requests and ignores aborted results. Only typing waits for the 300ms debounce; settled-search pagination and category/gender actions can fetch immediately. Old search responses cannot replace the latest results. Skeletons/status text reduce blank waiting states.
5. Recommendation count, candidate names and the owned profile's saved-name IDs are read concurrently rather than sequentially. Candidate/profile queries select only fields used by this page. Saved-state reads remain scoped by both authenticated userId and profileId; no user-specific shared cache was introduced. The parallel saved-ID query fetches the profile's ID set, which can be larger than the 12 visible results, to remove the dependent round trip.

These are concrete request/query changes, not a measured production speed guarantee. Cold starts, function/database region alignment, pool limits and service latency were not diagnosed from live telemetry. Do not move regions or change pooler credentials based on assumptions. Measure the deployed routes before further changes.

## Verification

- 28 unit/handler tests pass, including three new home URL-filter cases.
- Lint, Next route generation and isolated source type checking pass with schema-derived Prisma declarations as described in earlier releases.
- Headless Chromium checked the real local home page (HTTP 200), no uncaught browser exceptions, keyboard skip navigation and header/page widths at 320, 390, 768 and 1440 pixels.
- Browser interaction checks verified home search submission, category navigation, browse pagination with a settled search, selected-profile header links and a delayed obsolete search response not replacing the latest result. Browse API responses were deliberately mocked because live database credentials are unavailable. This validates the frontend behavior, not catalogue/database performance or authenticated navigation.
- Desktop/mobile screenshots were visually reviewed. Screenshots and the local browser-check script are outside the repository under `/workspace/babyname-review`.
- Production JavaScript compilation passed for this release. The normal local build still stops during model-dependent type checking because the installed Prisma client lacks generated declarations under the existing engine-download restriction; the isolated source check passes with actual schema-derived declarations. Live database/auth and production speed remain unverified. No production database, policy, runtime region or environment-variable changes are included.

## After Vercel deployment

1. Open `/` on desktop and mobile. Check navigation, the home logo, hero buttons, family cards and footer.
2. Search for a known name or meaning from home. Check that the name browser's input/results match. Try each category chip and a sample-name card.
3. From a selected baby, use the shared profile/recommendation/shortlist links and confirm it remains that baby. Signed-out protected destinations should continue to require login.
4. Type successive searches, change categories and use Next/Previous. Confirm the final search result stays correct and loading indicators clear.
5. Recheck Save/Remove and profile switching after the recommendation query change.
6. Compare deployed navigation and first-request timing; if still slow, inspect runtime/database region and cold-versus-warm timings. Do not use local mocked-browser timings as production evidence.

Keep existing Vercel build command and variables. No new SQL step is required.

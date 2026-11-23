# Development document audit

Reviewed 23 November 2026 against `Database_Schema_For_Development.docx`, the current workspace, and GitHub `origin/main` at `3fa0484`.

## Scope and limits

The uploaded document is a database schema guide, with a high-level product flow. It describes 16 tables and 3 enums, all represented in `prisma/schema.prisma`. That establishes schema coverage, not working features or populated production tables. No live database inspection was performed. Recommendations and name-detail additions exist locally but are absent from the fetched GitHub main branch. Their deployment is not established.

The document was treated as requirements/reference material. Its developer notes do not authorize running production migrations or deleting data. This audit changes documentation only.

## Status against the document

| Area | Current evidence | Status / remaining work |
| --- | --- | --- |
| User accounts | Email signup/login, Supabase callback and application-user sync code; user reported deployed signup working | Partial. Email-confirmation sequence is wrong: sync is attempted before checking for a session. Google has code but is unverified; Apple has only enum support. Password recovery, sign-out/account settings and their desired scope need definition. |
| Baby profiles | Authenticated GET/POST/PUT, ownership-scoped updates, form | Basic create/update works by user report. Form edits the first/latest profile; creating/selecting additional children is incomplete. Date/time/string bounds need stronger validation. |
| Name catalogue/categories | Search API and browser with pagination and filters | Basic browse works by user report. The committed seed has 18 sample names and 3 categories; this does not establish the production catalogue size or quality. There is no dataset/admin import workflow. |
| Name details | Local `/names/[id]` page, invalid-ID handling, detail links | Local implementation; not in fetched main or verified on Vercel. Audio and score presentation are not included. |
| General recommendations | Local authenticated page and preference-based ranking helper, five unit tests | Foundation only. Gender, starting syllable, length and Modern/Spiritual/Nature category preference. No semantic/AI service, religion filter, traditional/mythological handling or personalized numeric scores. Candidate cap is 200 and disclosed. |
| Stored recommendations | Recommendation model with unique baby/name pair | Pending. Current local page computes on request and does not write/read the recommendations table, score breakdown or recommendation reason records. |
| Astrology | Mapping and score models | Pending engine, validated reference dataset, input handling, rules and tests. |
| Numerology | Per-name score model | Pending agreed calculation system, validated dataset, compatibility calculation and tests. |
| Saved names | Model and SQL policies | Pending ownership-safe save/list/remove API and per-baby shortlist UI. |
| Search history | Model and SQL policy | Pending event definition, write/list functionality and retention decisions. |
| Trending names | Counter model and sortable sample score fields | Pending event recording, counter semantics, trend formula, refresh and UI. Sorting sample scores is not real analytics. |
| Family voting | Session/vote models and SQL policies | Pending selected-name membership, guest identity/duplicate policy, expiration enforcement, API, results and share UI. |
| Audio | URL/language model and read policy | Pending real audio source, player, storage/delivery and language coverage. |
| Premium/subscription | Model, enum and user flag | Pending feature limits, payment provider, checkout, verified webhooks, entitlement enforcement, cancellation and reconciliation. |
| Deployment/QA | Existing Vercel app and prior local tests | New local routes need source integration and deployed acceptance checks; fix vulnerable dependencies and stale lockfile before release. |

## Schema and product decisions to resolve

1. **Migration drift:** `Name.nameRomanized` is unique in Prisma, but the only committed SQL migration creates a non-unique index. A fresh migration deployment will not reproduce the Prisma uniqueness requirement used by seed upserts. Inspect actual constraints and duplicate spellings before adding a forward migration; do not edit an already applied migration or reset production. The document still describes the older non-unique index. Also decide whether the same romanized spelling with different origins/meanings should be allowed.
2. **Astrology input:** mappings are keyed by nakshatra + pada, while BabyProfile has no pada. Precise birth-chart calculation also needs an unambiguous local time/timezone, location coordinates and an agreed calculation method/provider; a free-text birthPlace alone does not supply those. Start with a validated user-provided nakshatra/pada lookup if approved, then add automated chart calculation as a separate milestone. Unknown birth time needs an explicit fallback.
3. **Numerology semantics:** decide the letter-number system, native versus romanized spelling, reduction/master-number rules, and the inputs to each score. If destiny/life-path depends on birth date, it cannot be represented only as a name-global value. Keep name-derived numbers separate from baby/name compatibility. Prosperity/harmony formulas are not supplied by the document.
4. **Final scoring:** AI/style, astrology and numerology weights, range, missing-input treatment and regeneration rules are undefined. The schema requires every score; missing/unsupported components should not be silently populated with invented values. Decide nullable components or an explicit availability/status design, version the scoring rules, and persist explanations. Unique baby/name rows support upserts but do not preserve past generation runs.
5. **Preference meaning:** the document calls maximum length characters/syllables; existing code uses character length. Choose one or introduce separate controls. Religion is stored on BabyProfile but no Name-to-religion mapping exists. Style/category taxonomy and the meaning of UNISEX on a baby profile need agreement.
6. **Multiple children:** finish profile creation/selection and carry the selected baby through recommendations, saved names and voting. Avoid silently applying actions to the latest baby.
7. **Voting membership:** a session currently has no explicit selected-name relation or snapshot. Define which names can receive votes, how a shortlist edit affects a poll, permitted voteScore bounds, repeat voting and expiration. Guest display names alone do not establish voter uniqueness.
8. **Authentication:** Supabase handles password credentials; do not add a duplicate application password store just because passwordHash exists. Consider storing Supabase auth user ID for stable account linkage rather than email only, with an explicit migration/account-update plan.
9. **Access control:** SQL policies are present, but their deployed state/grants have not been verified. The written subscriptions policy permits owner writes and the users update policy does not protect isPremium specifically. If applied with corresponding grants, those are unsuitable for server-controlled premium entitlements. Saved-name policy checks userId but not that babyProfileId belongs to the same user. Public voting policies do not require poll membership/expiration and permit broad session reads. Review policies and APIs together before these flows are exposed; application ownership checks remain necessary for direct Prisma access.
10. **Reference/data quality:** the seed's popularity/trend numbers and syllable counts are illustrative. Approve sources and validate meanings, scripts, phonetics, syllables, astrology mappings and numerology outputs. Do not present defaults or synthetic seed scores as measured real-world evidence.

## Where to start

First establish one deployable, tested baseline, keeping `/recommendations` as the profile-save destination. Then finish the parent-facing shortlist before expanding into scoring engines or payments.

### First five-hour session

| Time budget | Task | Evidence of completion |
| --- | --- | --- |
| 1 hour | Reconcile reviewed local changes with GitHub main; identify the intended demo database and non-secret configuration names | The new routes are in the intended source commit; no user work or production data lost. |
| 1 hour | Dependency/lockfile and migration-state review; address the build/security prerequisites | Frozen install/build succeeds or a precise external blocker is documented. Schema changes are planned after read-only DB inspection. |
| 2 hours | Deploy/test signup → profile → recommendations → name details, including no-profile and empty results | Correct commit deployed; actual authenticated acceptance checks pass. |
| 1 hour | Agree engine inputs/scoring decisions and record next-session acceptance criteria | Product decisions documented; shortlist implementation is the next bounded task. |

If baseline failures exceed the budget, continue them in the next session. Do not treat time elapsed as evidence of completion.

### Subsequent milestone order

1. Complete multi-baby selection, shortlist save/list/remove and account-isolation tests.
2. Finalize data contract and import/validate the catalogue and lookup datasets.
3. Implement astrology and numerology separately against approved examples; test each before combining scores.
4. Persist scored recommendations and explanations, implement refresh/upsert behavior and verify preference changes.
5. Implement search history/trends, audio and family voting as separate testable flows.
6. Implement premium entitlements and payments after feature limits/provider decisions; retain server-only billing writes.
7. Finish responsive UX, failure cases, deployment checks and client-demo rehearsal.

## Planning range at five hours per working day

- Basic client-demo journey (existing auth/profile + recommendations/details + shortlist + focused QA): approximately **20–35 hours / 4–7 working days**, assuming credentials, dataset and deployment access are ready. It does not include the full three-engine system.
- The broader documented feature set: use **80–140 hours / 16–28 working days** as an initial planning range, not a quote or deadline. Automated birth-chart computation, large curated datasets, paid providers and app-store billing can add substantial work. Refine after engine methods, data sources and premium rules are decided.
- Allocate roughly 3 hours implementation, 1 hour testing and 1 hour review/deployment per day. Re-estimate after each accepted milestone.

No completion percentage is assigned: schema coverage and functional completion are different, features have unequal effort, and live acceptance evidence is incomplete.

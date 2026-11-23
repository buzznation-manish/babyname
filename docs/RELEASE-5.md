# Login/logout and Google status

Prepared 23 November 2026. Scope: complete logout/session UI, fix email confirmation flow, improve authentication failure/redirect handling, and report Google availability accurately. No database migration, provider enablement, OAuth credential change or new environment variable is included.

## Login and logout

- Header auth controls lazy-load the existing browser Supabase client after render. INITIAL_SESSION/SIGNED_IN/SIGNED_OUT events update login versus logout UI. Browser session state controls presentation only; protected server pages and APIs continue to verify users independently.
- Log out calls the supported Supabase `signOut({ scope: 'local' })`: SDK-managed token/cookie clearing and sign-out for the current session. It does not sign other devices out or log the person out of their Google account.
- Successful logout uses a full `location.replace('/login?loggedOut=1')`, discarding Next's in-memory private page cache. Other initialized tabs react to sign-out events. A private page restored from browser back/forward cache reloads to revalidate server access.
- Failed sign-out shows a retry error and does not claim logout succeeded or deliberately navigate as if it did.
- Supabase access JWTs are bearer tokens and can remain valid until expiration; clearing this browser's session and revoking its refresh session is not a claim of instantaneous cryptographic revocation of an independently copied access token. Server authorization checks remain necessary.
- Email confirmation without a session is handled before application-user sync. A pending confirmation is no longer treated as a failed authenticated API request.
- Login/network failures clear pending UI and show a useful error. Password manager autocomplete is configured. New signup UI requires 8 characters; existing login passwords are not blocked by that new UI minimum. Configure authoritative password policy/rate limits in Supabase; client validation is not server enforcement.
- Login return links use an allowlist of local application destinations and preserve profile context; external/protocol-relative/backslash redirects are refused. Middleware retains the original private path/query for the validated return link.
- User sync and callback errors no longer return database internals or log user-response payloads to the browser console. Sync rejects cross-origin requests; callback still exchanges the PKCE code and validates the user before database sync. Neither step stores application passwords.

## Google: what is and is not confirmed

Google OAuth initiation and `/auth/callback` code already existed. The current execution machine has no Supabase project variables, cannot inspect the project's dashboard, and its outbound request to the deployed Vercel URL is blocked by the environment proxy. The user has not checked the provider toggle. Therefore **Google activation is unverified**, not confirmed inactive or fully working.

Login/signup now reads `/auth/v1/settings` on the configured Supabase project using the existing public anon key. This endpoint exposes provider flags, not client secrets:

- Explicit `external.google: false`: disable the Google button and explain that email should be used.
- Explicit `true`: permit the normal Google sign-in attempt. This establishes the enabled flag only, not valid client secrets/consent configuration or successful login.
- Unavailable/malformed response/timeout: explain that availability could not be verified; email stays usable and a Google attempt can still be made. Never infer disabled from a failed check.

No Google provider was turned on or off by this release. To verify/activate tomorrow:

1. Open Supabase Authentication → Sign In / Providers → Google and inspect Enabled and OAuth credential configuration securely.
2. In Google Cloud, the authorized redirect URI must be Supabase's provided callback (usually `https://PROJECT_REF.supabase.co/auth/v1/callback`), not the app callback.
3. In Supabase URL configuration, verify the deployed Site URL and allow `https://babyname-seven.vercel.app/auth/callback`. Google OAuth and confirmation email code exchanges return there.
4. Verify consent-screen/test-user restrictions, then complete an actual Google sign-in on the deployment and confirm application-user sync. Do not paste client secrets or database URLs into chat or add Google client secrets to NEXT_PUBLIC variables.

## Verification and acceptance

35 unit/handler tests pass, including pending-confirmation skipping sync, auth sync/navigation order, missing-session/sync-failure behavior, redirect rejection, local sign-out ordering/failure handling, and explicit Google enabled/disabled/unknown interpretation. Lint, route-type generation, isolated schema-derived source type-check and production JavaScript compilation pass. These are not real Supabase session, multi-tab, email-delivery or Google-account end-to-end tests. The ordinary full local build still stops at model-dependent type checking under the existing Prisma generation limitation.

After deployment:

1. Log in with the existing demo email account. Header should replace login/signup actions with Log out.
2. Log out from a private page. Confirm login shows the logout notice, private URLs require login again, and browser Back does not restore usable authenticated access. Retest in another initialized tab.
3. Log in again after requesting an older baby's private URL. Confirm the selected profile ID is retained.
4. Test invalid credentials and a temporary network failure: pending UI must recover. Test confirmation-required signup with an authorized development address if confirmation is enabled.
5. Check the Google status message on login/signup and the actual provider settings. Complete Google consent before marking Google sign-in working.

Existing Vercel build command and variables remain unchanged. No new SQL step is required. Pause new feature work after these checks, as requested; remaining platform work continues next session.

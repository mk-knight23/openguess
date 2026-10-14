# Optional free cloud accounts

Gameplay and local JSON backups work without an account or network connection. This deployment optionally uses a provisioned Supabase free-plan project for email/password accounts, private progress backups, and opt-in community scores. Free hosting/database quotas are finite; gameplay has no paid tier, but unlimited hosted storage is not promised.

## Player control and privacy

Saving a cloud backup is explicit. Signing in never overwrites local progress. Restoring first loads a preview, then requires a separate confirmation that replaces this browser's progress. Backups include the local profile, preferences, collection, recent games, and daily completions. Cloud backups are limited to 2 MB; larger collections can still use local exports.

Community scores are also explicit. Publishing sends the nickname and self-reported win count. These are personal browser scores, not cheat-resistant competitive rankings. No scores are silently published and no placeholder rankings appear. Players can remove their public score, delete their private backup, and sign out from the same panel. Deleting a backup does not delete local progress or the authentication account.

Supabase Auth stores the account email and password verifier. The public score table has no email or progress column. Anonymous and signed-in readers can retrieve only nickname and wins through the bounded public score function. Raw score records and owner UUIDs are restricted to each authenticated owner. Private progress is restricted to its authenticated owner by database row-level security. Authenticated users can insert, update, and delete only their own backup and public score; updates cannot reassign ownership.

## Deployment

Browser builds need only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (a publishable key or legacy anonymous key)

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, database connection strings/passwords, JWT signing secrets, or management tokens in `VITE_` variables, HTML, repository files, or public build logs. The client rejects modern secret keys and legacy JWT keys whose role is not `anon`.

The schema migrations are in `supabase/migrations/`. Apply it through the Supabase CLI to your own project, with private connection credentials supplied securely. Both exposed tables explicitly enable RLS, revoke default grants, and grant only necessary operations. Every mutation includes `auth.uid() = user_id` ownership checks; updates have both `USING` and `WITH CHECK`. There are no views. The intentionally public `og_public_scores()` function uses `SECURITY DEFINER` solely to return a bounded projection of already published nickname/win fields while raw rows remain owner-only. It has no parameters, accepts no dynamic SQL, performs no writes, uses fully qualified table names and an empty `search_path`, and has default PUBLIC execution revoked before explicit anonymous/authenticated execution grants. It cannot expose email, progress, or owner IDs.

Add the deployed site URL to Supabase Auth's Site URL and allowed redirect URLs. Email confirmation may be enabled by the project. Supabase's built-in email sender has delivery restrictions and is not a production email service; configure a suitable SMTP provider for unrestricted public sign-up. Until then, signup may fail or confirmation messages may not arrive. The UI shows actual provider errors and keeps offline gameplay available. No claim is made that default SMTP supports worldwide public registration.

## Verification

`node scripts/verify-cloud.mjs` performs live API verification using temporary users created by the administrative API with pre-confirmed invalid-domain email addresses; it sends no emails. It verifies owner CRUD, isolation between two accounts, anonymous denial for private progress and score writes, ownership reassignment rejection, public display-field reads, owner ID isolation for signed-out and signed-in visitors, opt-out, and cleanup. It requires the private `.env.local` verification credentials and must not run inside a browser or be bundled into the app.

The first run failed because the tables were absent. After applying the schema, 24 live ownership checks passed and temporary users were removed. Supabase CLI security advisors reported no issues. JavaScript unit tests separately cover client-key safety, validated backups, authenticated mutations, safe public field selection, and real error propagation. The browser panel requires a live deployment smoke check; unit tests do not replace that.

Reviewed on 2026-10-14 against [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security), [password authentication](https://supabase.com/docs/guides/auth/passwords), [SMTP limitations](https://supabase.com/docs/guides/auth/auth-smtp), and [the changelog](https://supabase.com/changelog). The current TLS deprecation concerns old CBC ciphers; no legacy TLS settings are used here. Recent PostgreSQL extension breaking changes do not affect these plain JSONB/text tables.

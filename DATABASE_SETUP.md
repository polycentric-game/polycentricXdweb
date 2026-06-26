# Database Setup Instructions

## Supabase Database Migration

This fork uses the **DWeb Nomad Infrastructure** schema with narrative-only agreements. Legacy equity-swap migrations are in `supabase/migrations/legacy/` and should not be used for new installs.

Run these migrations in order on a **new** Supabase project:

1. `supabase/migrations/001_dweb_nomad_schema.sql` — tables
2. `supabase/migrations/002_seed_role_templates.sql` — 31 role templates from [polycentricXdweb.md](../polycentricXdweb.md)
3. `supabase/migrations/003_add_games.sql` — games table and game-scoped role claims
4. `supabase/migrations/004_rls_policies.sql` — **required** row-level security policies (without this, API calls return 403)
5. `supabase/migrations/005_multiparty_agreements.sql` — multi-party support (`party_role_ids` array)

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and run `001_dweb_nomad_schema.sql`
4. Copy and run `002_seed_role_templates.sql`
5. Copy and run `003_add_games.sql`
6. Copy and run `004_rls_policies.sql`
7. Copy and run `005_multiparty_agreements.sql`

### Option 2: Using Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### Option 3: Manual SQL Execution

Connect with any PostgreSQL client and execute both migration files in order.

## Authentication (Supabase magic link)

This version uses **email magic link** auth instead of Ethereum wallets.

### Supabase dashboard setup

1. Go to **Authentication → Providers → Email** and ensure Email is enabled.
2. Under **Authentication → URL Configuration**, add redirect URLs:
   - `http://localhost:3000/auth/callback` (local dev)
   - Your production URL + `/auth/callback` when deployed
   - Site URL should match your app origin (e.g. `http://localhost:3000`)
3. Optional: disable "Confirm email" if you want instant magic-link sign-in during development.

**No custom SMTP or email template edits are required.** On new free-tier projects (June 2026+), Supabase locks template editing unless you add your own SMTP provider — the default magic-link email is fine. The app handles sign-in in two ways:

- **Tap the link** in the email (uses implicit flow; works from most email apps).
- **Copy/paste the link** on the login screen if the callback page stalls — paste the full URL from the email button (works without editing Supabase templates).

Optional: [Resend](https://resend.com) offers a free tier (~100 emails/day) if you later want custom email branding or 6-digit codes in the email body.

### How magic link sign-in works

1. User requests a link → Supabase emails a **Sign in** button
2. Clicking it redirects to `/auth/callback?code=…`
3. A **server route** exchanges the code for a session (PKCE verifier stored in cookies via `@supabase/ssr`)
4. User is redirected to `/` — signed in

If the link opens in a different browser, use **paste link** on the login screen after requesting a new email.

Hash-based redirects (`#access_token=…`) are handled at `/auth/confirm` (client-only fallback).

### Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

On sign-in, the app upserts a row in `users` using the Supabase Auth user id (`auth.users.id` → `users.id`). **Users are not assigned a role on login** — create or join a game, then claim a role within that game.

### Row Level Security (403 errors)

If the browser console shows **403** on `/rest/v1/users` or `/rest/v1/games`, Supabase is blocking writes because RLS policies are missing. Run `004_rls_policies.sql` in the SQL Editor. This grants authenticated users permission to:

- Upsert their own `users` profile (`id = auth.uid()`)
- List and create `games`
- Claim `roles` within a game
- Read `role_templates` (including before sign-in)

## Required Tables

| Table | Purpose |
|-------|---------|
| `games` | Multiplayer game sessions (unique title) |
| `users` | App user profiles (id matches Supabase Auth user id) |
| `role_templates` | 31 preset roles from the deck (seeded) |
| `roles` | Player role instances scoped to a game (one template per game, one role per user per game) |
| `agreements` | Multi-party agreements with narrative terms in `versions` JSONB and `party_role_ids` |
| `sessions` | User sessions (`role_id` references active role) |

## Agreement terms (Approach A)

Agreements store **narrative commitments only** — no numeric resource budgets. Each version includes:

- `commitments` — map of `roleId → text` describing what each party offers
- `notes` — combined effect when all offers are fulfilled
- `party_role_ids` — all participating roles (2 to N, up to every player in the game)

See [docs/DESIGN_DECISIONS.md](../docs/DESIGN_DECISIONS.md).

## Regenerating role seed data

If you edit `polycentricXdweb.md`:

```bash
node scripts/parse-role-templates.mjs
node scripts/generate-role-seed-sql.mjs
```

## After Running Migration

```bash
npm run dev
```

Ensure `.env.local` points at your new Supabase project URL and anon key.
